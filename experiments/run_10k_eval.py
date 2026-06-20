"""
Full 10k evaluation with multi-signal mu convergence.
Parallelized: NLI on 6 threads, batch embedding.
Generates a comprehensive CSV report.
"""
import json, os, subprocess, sys, time, csv, re, math, random
sys.stdout.reconfigure(line_buffering=True)
from pathlib import Path
from typing import List, Dict, Optional
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = Path(__file__).resolve().parent.parent
PYTHON = "C:\\Users\\kriti\\AppData\\Local\\Programs\\Python\\Python310\\python.exe"
EMBED_URL = "http://127.0.0.1:4096"
random.seed(42)

N_CASES = 10000
BATCH_SIZE = 50
N_THREADS = 6

STOPWORDS = set("a an the is are was were be been being have has had do did does will would shall should may might can could must need ought to in on at for by with from of to as into through during before after above below between out off over under again further then once here there when where why how all each every both few more most other some such no nor not only own same so than too very just because but or and if while although since until".split())

def make_messy_pool() -> List[Dict]:
    topics = [
        ("Transformer Models", "the transformer architecture introduced in 2017 by vaswani et al revolutionized NLP. its based on self-attention mechanisms that process all tokens in parallel unlike RNNs. BERT GPT and T5 all use transformers. some people argue theyre just really big matrix multiplications but hey it works."),
        ("Neural Networks", "neural networks are computing systems vaguely inspired by biological brains. they consist of layers of interconnected nodes called neurons. each connection has a weight that adjusts during training. deep learning means having many layers. its not actually like a brain at all despite the name."),
        ("Gradient Descent", "gradient descent is the workhorse optimization algorithm in machine learning. you compute the gradient of the loss function and take steps in the opposite direction. learning rate matters a lot too small and you never converge too large and you diverge. adaM is usually a safe default choice."),
        ("Reinforcement Learning", "rl is about an agent learning from rewards and punishments in an environment. its how alphago beat the world champion and how robots learn to walk. the exploration vs exploitation tradeoff is central. sometimes you have to try random things to discover better strategies."),
        ("Computer Vision", "cnns dominated computer vision for years with their translation equivariance built in through convolutions. but now vision transformers are giving them a run for their money. image classification object detection segmentation are the main tasks. data augmentation is critical for generalization."),
        ("Photosynthesis", "Photosynthesis is how plants convert sunlight into chemical energy. it happens in the chloroplasts using chlorophyll. the overall equation is 6CO2 + 6H2O -> C6H12O6 + 6O2. plants are basically solar-powered sugar factories. this process produces the oxygen we breathe."),
        ("DNA Structure", "DNA has a double helix structure discovered by watson and crick in 1953 based on xray crystallography data from Rosalind Franklin. the strands are made of nucleotides A T C G. A pairs with T and C pairs with G. human DNA has about 3 billion base pairs."),
        ("Plate Tectonics", "the Earths lithosphere is divided into tectonic plates that float on the asthenosphere. they move a few centimeters per year driven by mantle convection. earthquakes and volcanoes mostly occur at plate boundries. the theory was controversal when first proposed in the 1960s."),
        ("Evolution", "evolution by natural selection was proposed by charles darwin in on the origin of species 1859. individuals with advantageous traits survive and reproduce more. over millions of years this drives adaptation and speciation. its often mischaracterized as survival of the fittest which is circular."),
        ("Quantum Mechanics", "quantum mechanics describes nature at the atomic and subatomic scale. particles behave as both waves and particles depending on how you measure them. the schrodinger equation describes how quantum states evolve. observation collapses the wavefunction. nobody really understands it says feynman."),
        ("Roman Empire", "the roman empire at its peak stretched from britain to mesopotamia. it lasted roughly 500 years from 27 BCE to 476 CE. they contibuted law engineering and the latin alphabet to western civilization. the fall was caused by a combination of economic decline military overspending and political corruption."),
        ("World War II", "ww2 lasted from 1939 to 1945 involving most of the worlds nations. it was the deadliest conflict in human history with 70-85 million casualties. the war ended with the atomic bombings of hiroshima and nagasaki. the united nations was established afterward to prevent future wars."),
        ("Industrial Revolution", "the industrial revolution started in britain around 1760. steam power mechanized textile production and railways transformed transportation. people moved from farms to cities in massive numbers. working conditions were terrible at first with child labor and 16hour workdays common."),
        ("Cold War", "the cold war was a period of geopolitical tension between the US and Soviet Union from 1947 to 1991. they never fought directly but proxy wars happened in korea vietnam afghanistan. the space race and arms race were major features. the Berlin Wall fell in 1989 symbolizing the end."),
        ("French Revolution", "the French Revolution began in 1789 with the storming of the Bastille. the motto was liberte egalite fraternite. it got pretty bloody with the reign of terror under Robespierre executing 17000 people. Napoleon eventually took over and became emperor."),
        ("Albert Einstein", "einstein was a theoretical physicist who developed the theory of relativity. his famous equation E=mc^2 shows mass and energy are equivalent. he won the nobel prize for the photoelectric effect not relativity. he was a pacifist and jewish refugee who fled nazi germany to the US."),
        ("Marie Curie", "marie curie was a physicist and chemist who pioneered research on radioactivity. she discovered polonium and radium. she won nobel prizes in both physics and chemistry the first person to do so. she died of aplastic anemia from radiation exposure. her notebooks are still radioactive."),
        ("Alan Turing", "alan turing was a mathematician and computer scientist. he formalized the concept of computation with the turing machine. he cracked the enigma code during ww2 which historians say shortened the war by years. he was prosecuted for homosexuality and chemically castrated. he died of cyanide poisoning."),
        ("Leonardo da Vinci", "da vinci was a renaissance polymath artist inventor and scientist. hes most famous for painting the mona lisa and the last supper. he filled notebooks with anatomical drawings flying machines and observations. he wrote in mirror script. only about 15 of his paintings survive."),
        ("Frida Kahlo", "frida kahlo was a mexican painter known for her self-portraits and surrealist style. she was in a terrible bus accident as a teenager that left her in pain her whole life. she married diego rivera twice. her work explores identity pain and mexican culture. she became a feminist icon posthumously."),
        ("Michael Jordan", "michael jordan is widely considered the greatest basketball player ever. he won 6 NBA championships with the chicago bulls in the 1990s. his airness was known for his competitive drive and clutch performances. he also tried baseball and owned the charlotte hornets."),
        ("Serena Williams", "serena williams is one of the greatest tennis players of all time. she won 23 grand slam singles titles the most in the open era. she played with her sister venus and they dominated womens tennis for over a decade. shes also a businesswoman and venture capitalist."),
        ("Usain Bolt", "usain bolt is the fastest human ever timed. he holds world records in the 100m 200m and 4x100m relay. from jamaica he won 8 olympic gold medals. his signature celebration is the lightning bolt pose. he retired in 2017 and tried football unsuccessfully."),
        ("Japan", "japan is an island nation in east asia with a population of 125 million. its known for its blend of ancient traditions and cutting-edge technology. tokyo is the largest metropolitan area in the world. the country experiences frequent earthquakes including the 2011 disaster that caused a nuclear meltdown at Fukushima."),
        ("Brazil", "brazil is the largest country in south america covering nearly half the continent. the amazon rainforest which is crucial for global climate is mostly in brazil. rio de Janeiro is famous for its carnival festival and christ the redeemer statue. portuguese is the official language unlike the rest of south america."),
        ("Antarctica", "antarctica is the coldest driest and windiest continent. it contains 90 percent of the worlds ice and 70 percent of its fresh water. no humans live there permanently only scientists on research stations. the antarctic treaty preserves it for peaceful scientific research. its getting warmer though."),
        ("Cats vs Dogs", "cats and dogs are the two most popular pets in the world. dogs were domesticated about 15000 years ago while cats domesticated themselves about 10000 years ago. the internets favorite debate. dogs are pack animals cats are solitary. both are fine honestly depends on your lifestyle."),
        ("Coffee", "coffee is one of the most consumed drinks worldwide. its made from roasted coffee beans which are actually the seeds of coffee cherries. brazil is the largest producer. caffeine blocks adenosine receptors making you feel alert. too much coffee makes me jittery personally."),
        ("The Moon", "the moon is earths only natural satellite. its about 384400 km away and 1/4 the size of earth. the moon landing in 1969 is one of humanitys greatest achievements. conspiracy theorists think it was faked but theres overwhelming evidence we went. the moon is slowly drifting away."),
        ("Internet", "the internet started as ARPANET a US military project in the 1960s. tim bernerslee invented the world wide web in 1989. now theres like 5 billion users. its basically a series of tubes filled with cat videos and arguments. net neutrality is a recurring political issue."),
        ("Pizza", "pizza originated in naples italy as a dish for poor people. the margherita pizza was created in 1889 to honor queen margherita with tomatoes mozzarella and basil representing the italian flag. its now a global phenomenon with endless variations. pineapple on pizza is controversal but honestly its fine."),
        ("Blockchain", "blockchain is a distributed ledger technology that underpins cryptocurrencies like bitcoin. each block contains a cryptographic hash of the previous block creating a chain. its supposed to be immutable and trustless. in practice its slow expensive and most applications havent found productmarket fit outside speculation."),
        ("Climate Change", "the earths average temperature has risen about 1.2C since preindustrial times. the overwhelming consensus among climate scientists is that humans are causing it through greenhouse gas emissions. effects include sea level rise more extreme weather and biodiversity loss. the paris agreement aims to limit warming to 1.5C but were not on track."),
        ("Cooking", "cooking is both an art and a science. the maillard reaction is responsible for browning and flavor development when you sear meat. salt enhances flavor acid balances it. mise en place means having everything prepared before you start cooking. a sharp knife is safer than a dull one."),
        ("Sleep", "adults need 7-9 hours of sleep per night for optimal health. sleep is when the brain clears waste products and consolidates memories. chronic sleep deprivation is linked to obesity heart disease and depression. screens before bed suppress melatonin production. idont get nearly enough sleep these days."),
        ("Music", "music is a universal human phenomenon found in every known culture. it involves organized sound and silence over time. different cultures use different scales and instruments. streaming has completely transformed the music industry. algorithms now determine what most people listen to raising questions about taste and diversity."),
        ("Python vs JavaScript", "python and javascript are two of the most popular programming languages. python dominates data science and ML while javascript rules web development. python uses indentation for blocks javascript uses curly braces. both are dynamically typed interpreted languages. the war between them is tiresome just use the right tool for the job."),
        ("Databases", "databases store organized data. SQL databases use tables and relationships while NoSQL databases use various models like documents or keyvalue pairs. postgresql is open source and powerful. mongodb is popular but leads to data inconsistency. choosing the right database depends on your data model and access patterns."),
        ("Startups", "most startups fail within the first 2 years. the ones that succeed often pivot from their original idea. finding productmarket fit is the hardest part. venture capital is a hitsdriven business where a few companies return the entire fund. the lean startup methodology emphasizes rapid iteration and validated learning."),
        ("Cryptography", "cryptography is the practice of secure communication in the presence of adversaries. public key cryptography enables secure communication without sharing a secret key first. RSA and elliptic curve cryptography are widely used. quantum computers threaten to break current publickey systems. AES is still considered secure for symmetric encryption."),
        ("Linux", "linux is a free open source operating system kernel created by linus torvalds in 1991. it powers most of the internets servers android phones and supercomputers. theres a distribution for every use case ubuntu for beginners arch for tinkerers. the command line is powerful but has a steep learning curve."),
    ]
    pool = []
    for title, text in topics:
        pool.append({"id": title.lower().replace(" ","_"), "title": title, "text": text})
        if random.random() < 0.3:
            pool.append({"id": title.lower().replace(" ","_")+"_trunc", "title": title, "text": text[:random.randint(len(text)//2, len(text))]})
    random.shuffle(pool)
    return pool

def extract_answer_phrase(text, fallback_title):
    words = text.split()
    if len(words) < 10: return fallback_title
    n = random.randint(2, min(5, len(words)//2))
    start = random.randint(0, max(0, len(words)-n-1))
    phrase = " ".join(words[start:start+n])
    phrase = re.sub(r"[^\w\s\'-]", "", phrase).strip()
    return phrase if len(phrase) > 2 else fallback_title

def build_question(context_text, article_title):
    sentences = re.split(r"(?<=[.!?])\s+", context_text[:300])
    first_s = sentences[0] if sentences else context_text[:80]
    words = first_s.split()
    key = " ".join(words[:min(6, len(words))]) if len(words) > 3 else article_title
    return f"What is {key}?" if not key.startswith("What") else key

def generate_dataset(articles, n):
    cases = []; n_art = len(articles)
    types = ["correct+coherent","correct+incoherent","wrong+incoherent","retrieval_fail"]
    weights = [0.25, 0.20, 0.35, 0.20]
    for i in range(n):
        a_idx = i % n_art; art = articles[a_idx]; ctx, title = art["text"], art["title"]
        t = random.choices(types, weights=weights)[0]
        question = build_question(ctx, title)
        if t == "correct+coherent":
            ans = extract_answer_phrase(ctx, title); predicted = ans; ground = ans; exp_c = True
        elif t == "correct+incoherent":
            ans = extract_answer_phrase(articles[(a_idx+random.randint(1, n_art//3))%n_art]["text"], articles[(a_idx+random.randint(1, n_art//3))%n_art]["title"])
            predicted = ans; ground = ans; exp_c = False
        elif t == "wrong+incoherent":
            other = articles[(a_idx+random.randint(1, n_art//2))%n_art]
            wrong_ans = extract_answer_phrase(other["text"], other["title"])
            real_ans = extract_answer_phrase(ctx, title)
            predicted = wrong_ans; ground = real_ans if real_ans else title
            exp_c = wrong_ans.lower() not in ctx.lower()
        else:
            predicted = ""
            ground = extract_answer_phrase(ctx, title) if random.random() > 0.5 else "unknown"
            ctx = question; exp_c = False
        cases.append({"id":f"case_{i:05d}", "question":question, "context":ctx,
                      "predicted_answer":predicted or "", "ground_truth":ground, "expected_coherent":exp_c})
    return cases

def normalize(s):
    s = s.lower(); s = re.sub(r"\b(a|an|the)\b", " ", s); s = re.sub(r"[^\w\s]", "", s)
    return " ".join(s.split())

def f1_score(pred, gold):
    p,g = normalize(pred).split(), normalize(gold).split()
    if not p or not g: return 0.0
    common = set(p)&set(g)
    if not common: return 0.0
    prec = len(common)/len(p); rec = len(common)/len(g)
    return 2*prec*rec/(prec+rec)

def supporting_sentence(text, context):
    sentences = re.split(r"(?<=[.!?])\s+", context)
    for s in sentences:
        if text.lower() in s.lower(): return s
    return context[:500]

def softmax_contradiction(nli):
    logits = [nli["contradiction"], nli["entailment"], nli["neutral"]]
    mx = max(logits); exps = [math.exp(l-mx) for l in logits]; s = sum(exps)
    return exps[0]/s if s>0 else 0.0

def classify_batch(pairs_batch):
    try:
        r = requests.post(f"{EMBED_URL}/classify", json={"pairs":pairs_batch}, timeout=120)
        if r.status_code==200: return r.json()["results"]
    except: pass
    return [None]*len(pairs_batch)

def compute_rhos(texts):
    if not texts: return []
    try:
        r = requests.post(f"{EMBED_URL}/embed", json={"texts":texts}, timeout=60)
        if r.status_code!=200: return [0.5]*len(texts)
        results = []
        for vec in r.json()["embeddings"]:
            abs_sum = sum(abs(v) for v in vec)
            if abs_sum<1e-10: results.append(0.5); continue
            probs = [abs(v)/abs_sum for v in vec]
            entropy = -sum(p*math.log2(p) for p in probs if p>0)
            results.append(round(1.0-(entropy/math.log2(len(vec))),4))
        return results
    except: return [0.5]*len(texts)

def get_content_words(text):
    return [w for w in re.findall(r"\b[a-zA-Z]+\b", text.lower()) if w not in STOPWORDS]

def extract_entities(text):
    ents = set()
    for m in re.finditer(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", text):
        ents.add(m.group().lower())
    for m in re.finditer(r"\b[A-Z]{2,}\b", text):
        ents.add(m.group().lower())
    return ents

def compute_contradiction_signals(answer, evidence, question, nli_result=None):
    signals = {}; reasons = []
    chi_nli = softmax_contradiction(nli_result) if nli_result else 0.0
    signals["nli"] = round(chi_nli, 4)
    if chi_nli > 0.5:
        reasons.append(f"The NLI model finds that '{answer}' semantically contradicts the evidence (NLI score: {chi_nli:.2f})")
    ans_words = get_content_words(answer)
    ev_words = get_content_words(evidence)
    if ans_words:
        missing = [w for w in ans_words if w not in ev_words]
        chi_lex = len(missing)/len(ans_words)
    else:
        chi_lex = 0.0; missing = []
    signals["lexical"] = round(chi_lex, 4)
    if chi_lex > 0.3:
        reasons.append(f"The answer contains words ({', '.join(missing[:5])}) that do not appear in the evidence at all")
    ans_ents = extract_entities(answer)
    ev_ents = extract_entities(evidence)
    if ans_ents:
        missing_ents = [e for e in ans_ents if e not in ev_ents]
        chi_ent = len(missing_ents)/len(ans_ents)
    else:
        chi_ent = 0.0; missing_ents = []
    signals["entity"] = round(chi_ent, 4)
    if chi_ent > 0.3:
        reasons.append(f"Key names or terms ({', '.join(missing_ents[:3])}) found in the answer are missing from the evidence")
    chi_c = max(chi_nli, chi_lex, chi_ent)
    signals["combined"] = round(chi_c, 4)
    if chi_c >= 0.5:
        explanation = f"Answer \"{answer}\" contradicts the evidence. "
        if reasons: explanation += "; ".join(reasons) + ". "
        explanation += f"Evidence says: \"{evidence}\""
    elif chi_c >= 0.3:
        explanation = f"Answer \"{answer}\" may not match the evidence. "
        if reasons: explanation += "; ".join(reasons) + ". "
        else: explanation += f"Partial word overlap with evidence. "
        explanation += f"Evidence: \"{evidence}\""
    else:
        explanation = f"Answer \"{answer}\" is consistent with the evidence."
    return chi_c, signals, explanation

def generate_fix_suggestion(answer, question, signals):
    search_words = []
    fix_type = "none"
    reason = ""
    if signals["lexical"] > 0.3:
        search_words.extend(get_content_words(answer))
        fix_type = "lexical"
        reason = f"missing answer words in evidence"
    ans_ents = list(extract_entities(answer))
    if signals["entity"] > 0.3 and ans_ents:
        search_words.extend(ans_ents)
        fix_type = "entity"
        reason = f"missing entities in evidence"
    if signals["nli"] > 0.5:
        search_words.extend([question, answer])
        fix_type = "nli"
        reason = f"semantic contradiction"
    if fix_type == "none":
        return fix_type, "", reason
    return fix_type, " ".join(search_words), reason

def search_better_evidence(search_query, articles, current_evidence):
    query_words = set(get_content_words(search_query))
    if not query_words:
        return current_evidence
    best_text = current_evidence
    best_score = sum(1 for w in query_words if w in get_content_words(current_evidence))
    for art in articles:
        ev_words = set(get_content_words(art["text"]))
        overlap = len(query_words & ev_words)
        if overlap > best_score:
            best_score = overlap
            best_text = art["text"]
    if best_text != current_evidence:
        return best_text
    return current_evidence

def main():
    t_start = time.time()
    
    print("=" * 72)
    print(f"10K EVALUATION — MU-CONVERGENCE WITH IMPROVEMENT LOOP")
    print("=" * 72)
    
    print("\n[1] Checking embedding service...")
    try:
        r = requests.get(f"{EMBED_URL}/health", timeout=5)
        if r.status_code != 200:
            print(f"  FAIL: embedding service not healthy on {EMBED_URL}")
            sys.exit(1)
        print(f"  OK: {r.json().get('status', 'unknown')}")
    except requests.exceptions.ConnectionError:
        print(f"  FAIL: cannot connect to embedding service at {EMBED_URL}")
        print(f"  Start it with: EMBEDDING_PORT=4096 python embedding/server.py")
        sys.exit(1)
    
    print("\n[2] Generating article pool...")
    articles = make_messy_pool()
    print(f"  {len(articles)} passages across 40 topics")
    
    print("\n[3] Generating test dataset...")
    cases = generate_dataset(articles, N_CASES)
    print(f"  {N_CASES} cases")
    
    all_pairs = []; all_meta = []; all_contexts = []
    for c in cases:
        q,ctx,pred,gt = c["question"],c["context"],c["predicted_answer"],c["ground_truth"]
        ans_str = pred if pred else gt
        supp = supporting_sentence(ans_str, ctx) if ans_str and ctx else ctx[:500]
        all_pairs.append([f"{q} {ans_str}", supp])
        all_meta.append({"id":c["id"], "question":q, "predicted":ans_str, "ground_truth":gt, "context":ctx,
                         "expected_coherent":c["expected_coherent"]})
        all_contexts.append(ctx)
    
    print(f"\n[4] Parallel NLI classification ({len(all_pairs)} pairs)...")
    t0 = time.time()
    batches = [all_pairs[i:i+BATCH_SIZE] for i in range(0, len(all_pairs), BATCH_SIZE)]
    all_nli = [None]*len(all_pairs)
    with ThreadPoolExecutor(max_workers=N_THREADS) as ex:
        futs = {ex.submit(classify_batch, b):i for i,b in enumerate(batches)}
        done = 0
        for f in as_completed(futs):
            bi = futs[f]; nlis = f.result(); offset = bi*BATCH_SIZE
            for j,nli in enumerate(nlis):
                if offset+j < len(all_nli): all_nli[offset+j] = nli
            done += 1
            if done%20==0: print(f"  {done}/{len(batches)} batches ({100*done//len(batches)}%)")
    t_nli = time.time() - t0
    print(f"  NLI done in {t_nli:.1f}s ({t_nli/len(all_pairs):.2f}s/pair)")
    
    print(f"\n[5] Batch rho computation...")
    t1 = time.time()
    qa_texts = [p[0] for p in all_pairs]; supp_texts = [p[1] for p in all_pairs]
    rhos_a = compute_rhos(qa_texts); rhos_b = compute_rhos(supp_texts)
    print(f"  Rho done in {time.time()-t1:.1f}s")
    
    print(f"\n[6] Multi-signal detection + improvement loop...")
    fixed_count = 0
    fixable_count = 0
    results = []
    
    for i in range(len(all_meta)):
        m = all_meta[i]; nli = all_nli[i]
        answer = m["predicted"]; question = m["question"]
        supp_txt = supp_texts[i]; original_ctx = m["context"]
        
        chi_c, signals, explanation = compute_contradiction_signals(answer, supp_txt, question, nli)
        rho = (rhos_a[i] + rhos_b[i]) / 2
        mu = rho / chi_c if chi_c > 0 else 1.0
        mu = max(0.0, min(1.0, round(mu, 4)))
        
        improved = False
        new_mu = mu
        new_signal = signals
        new_explanation = explanation
        new_evidence = supp_txt
        fix_action = "none"
        fix_query = ""
        
        if mu < 0.1:
            fix_type, search_query, fix_reason = generate_fix_suggestion(answer, question, signals)
            fix_query = search_query
            fix_action = fix_type
            if fix_type != "none" and search_query:
                fixable_count += 1
                better_ctx = search_better_evidence(search_query, articles, original_ctx)
                if better_ctx != original_ctx:
                    new_supp = supporting_sentence(answer, better_ctx) if answer and better_ctx else better_ctx[:500]
                    new_chi, new_sig, new_exp = compute_contradiction_signals(answer, new_supp, question, nli)
                    new_rhos = compute_rhos([f"{question} {answer}", new_supp])
                    new_rho = (new_rhos[0] + (new_rhos[1] if len(new_rhos) > 1 else rho)) / 2
                    new_mu_val = new_rho / new_chi if new_chi > 0 else 1.0
                    new_mu = max(0.0, min(1.0, round(new_mu_val, 4)))
                    
                    if new_mu >= 0.3 and mu < 0.1:
                        improved = True
                        fixed_count += 1
                    
                    new_evidence = new_supp
                    new_signal = new_sig
                    new_explanation = new_exp
        
        final_mu = new_mu
        if final_mu >= 0.3: coherence = "coherent"
        elif final_mu >= 0.1: coherence = "weak"
        else: coherence = "contradicted"
        
        corr = 1 if normalize(answer) == normalize(m["ground_truth"]) else 0
        
        results.append({
            "id": m["id"], "question": question,
            "predicted": answer, "ground_truth": m["ground_truth"],
            "answer_correct": corr,
            "f1": round(f1_score(answer, m["ground_truth"]), 4),
            "mu_before": round(mu, 4),
            "mu_after": final_mu,
            "chi_nli": new_signal["nli"],
            "chi_lexical": new_signal["lexical"],
            "chi_entity": new_signal["entity"],
            "chi_combined": new_signal["combined"],
            "rho": round(rho, 4),
            "coherence": coherence,
            "flagged": int(final_mu < 0.1),
            "expected_coherent": int(m["expected_coherent"]),
            "explanation": new_explanation,
            "fix_type": fix_action,
            "fix_query": fix_query,
            "rag_improved": int(improved),
        })
        
        if (i+1) % 2000 == 0:
            print(f"  {i+1}/{N_CASES} processed")
    
    # Report
    n = len(results)
    total_s = time.time() - t_start
    print("\n" + "=" * 72)
    print(f"RESULTS — {N_CASES} CASES, {total_s:.0f}s TOTAL")
    print("=" * 72)
    
    ca = sum(r["answer_correct"] for r in results)
    print(f"\nAxis 1 — Answer Accuracy:          {ca:>4}/{n} ({100*ca/n:.1f}%)")
    ec = sum(1 for r in results if r["coherence"]=="coherent")
    ew = sum(1 for r in results if r["coherence"]=="weak")
    ex = sum(1 for r in results if r["coherence"]=="contradicted")
    print(f"Axis 3 — Coherent: {ec}  Weak: {ew}  Contradicted: {ex}")
    
    total_flagged = sum(1 for r in results if r["mu_before"] < 0.1)
    fixed = sum(r["rag_improved"] for r in results)
    print(f"\nImprovement Loop:")
    print(f"  Flagged before fix: {total_flagged}")
    print(f"  Fix attempted:      {fixable_count}")
    print(f"  Fixed:              {fixed}")
    print(f"  Fix rate:           {100*fixed/max(total_flagged,1):.1f}%")
    print(f"  Residual flagged:   {ex} ({100*ex/n:.1f}%)")
    
    cc = sum(1 for r in results if r["answer_correct"] and r["coherence"]=="coherent")
    cx = sum(1 for r in results if r["answer_correct"] and r["coherence"]=="contradicted")
    wc = sum(1 for r in results if not r["answer_correct"] and r["coherence"]=="coherent")
    wx = sum(1 for r in results if not r["answer_correct"] and r["coherence"]=="contradicted")
    print(f"\nCoherence x Accuracy:")
    print(f"                 coherent  contradicted")
    print(f"  correct        {cc:>5d}    {cx:>11d}")
    print(f"  wrong          {wc:>5d}    {wx:>11d}")
    
    hall_TP = sum(1 for r in results if not (r["answer_correct"] and r["coherence"]=="coherent") and r["flagged"])
    hall_FP = sum(1 for r in results if r["answer_correct"] and r["coherence"]=="coherent" and r["flagged"])
    hall_TN = sum(1 for r in results if r["answer_correct"] and r["coherence"]=="coherent" and not r["flagged"])
    hall_FN = sum(1 for r in results if not (r["answer_correct"] and r["coherence"]=="coherent") and not r["flagged"])
    prec = hall_TP/(hall_TP+hall_FP) if (hall_TP+hall_FP)>0 else 0
    rec = hall_TP/(hall_TP+hall_FN) if (hall_TP+hall_FN)>0 else 0
    f1h = 2*prec*rec/(prec+rec) if (prec+rec)>0 else 0
    print(f"\nHallucination Detection:")
    print(f"  TP={hall_TP} TN={hall_TN} FP={hall_FP} FN={hall_FN}")
    print(f"  Precision={prec:.4f}  Recall={rec:.4f}  F1={f1h:.4f}")
    
    os.makedirs(BASE / "experiments" / "reports", exist_ok=True)
    csv_path = BASE / "experiments" / "reports" / f"eval_10k_{int(time.time())}.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["id","question","predicted","ground_truth","answer_correct","f1",
            "mu_before","mu_after","chi_nli","chi_lexical","chi_entity","chi_combined","rho",
            "coherence","flagged","expected_coherent","explanation","fix_type","fix_query","rag_improved"])
        w.writeheader()
        for r in results:
            w.writerow({k:r[k] for k in w.fieldnames})
    print(f"\nCSV: {csv_path}")
    print("Done.")

if __name__ == "__main__":
    main()
