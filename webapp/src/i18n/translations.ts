// Flat key -> string dictionaries, one per supported language. Keys are
// looked up via useI18n().t('some.key'); English is the fallback for any
// key missing from another language.
//
// Not translated (documented scope limit, see webapp/README.md): the
// sensor/action names used only as compact labels inside the technical
// brain-diagram SVG.

export type Language = 'en' | 'de';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    'app.title': 'Evolution Simulator',
    'app.tagline': 'Interactive natural-selection sandbox — a web port of biosim4. Tune the world, watch generations evolve, live.',
    'app.runComplete': 'Run complete — reached generation {gen}.',
    'app.run50More': 'Run 50 more',
    'app.removeLimit': 'Remove limit',

    'header.themeLight': 'Light',
    'header.themeDark': 'Dark',
    'header.themeSystem': 'System',
    'header.language': 'Language',

    'controls.title': 'Controls',
    'controls.pause': 'Pause',
    'controls.play': 'Play',
    'controls.step': 'Step',
    'controls.restartRun': 'Restart run',
    'controls.simSpeed': 'Simulation speed',
    'controls.simSpeedSingular': '{n} step/frame',
    'controls.simSpeedPlural': '{n} steps/frame',
    'controls.maxGenerations': 'Max generations (0 = unlimited)',

    'controls.computeBackend': 'Compute backend',
    'controls.cpu': 'CPU',
    'controls.gpu': 'GPU',
    'controls.gpuChecking': '(checking…)',
    'controls.gpuUnavailable': '(unavailable)',
    'controls.gpuTitleUnavailable': 'WebGPU is not available in this browser',
    'controls.gpuTitleAvailable': "Batches neural-net evaluation for the whole population on the GPU",
    'controls.gpuHint':
      "GPU batches every creature's neural-net evaluation into one compute dispatch per step. It pays off most at large populations; for small ones CPU is usually faster.",

    'controls.selectionChallenge': 'Selection challenge',
    'controls.challengeHint': 'Determines which creatures survive to reproduce at the end of each generation. Takes effect next generation.',
    'controls.survivorPreview': "Preview who'd survive right now",

    'controls.barriers': 'Barriers',

    'controls.terrain': 'Terrain',
    'controls.terrainHint':
      'Cold terrain (blue) slows movement, hot terrain (amber) speeds it up -- a stand-in for snow/mud/elevation. Never blocks outright the way barriers do. Creatures can sense their current terrain temperature.',

    'controls.genetics': 'Genetics',
    'controls.mutationRate': 'Point mutation rate',
    'controls.sexualReproduction': 'Sexual reproduction (two parents)',
    'controls.biasByFitness': 'Bias parent choice by fitness',
    'controls.allowKilling': 'Allow killing neighbors',
    'controls.killTrueRng': 'Kill decisions use true RNG (drand/Cloudflare)',
    'controls.killTrueRngHint':
      'Each kill roll draws from a stream reseeded from a real drand beacon fetch at the start of every generation (falls back to the previous seed if the fetch fails).',

    'controls.sensing': 'Sensing',
    'controls.popSensorRadius': 'Population sensor radius',
    'controls.pheromoneSensorRadius': 'Pheromone sensor radius',
    'controls.showPheromones': 'Show pheromone overlay',

    'controls.export': 'Export',
    'controls.pngSnapshot': 'PNG snapshot',
    'controls.configJson': 'Config (JSON)',
    'controls.statsCsv': 'Stats (CSV)',
    'controls.stopRecording': '⏹ Stop recording',
    'controls.recordVideo': '⏺ Record video (WebM)',

    'controls.worldPopulation': 'World & population (requires restart)',
    'controls.worldWidth': 'World width',
    'controls.worldHeight': 'World height',
    'controls.population': 'Population',
    'controls.initialGenomeLength': 'Initial genome length',
    'controls.maxGenomeLength': 'Max genome length',
    'controls.maxNeurons': 'Max internal neurons',
    'controls.deterministicRng': 'Deterministic (seeded) RNG',
    'controls.rngSeed': 'RNG seed',
    'controls.fetchTrueSeed': '🎲 True random seed (drand/Cloudflare)',
    'controls.fetchingSeed': 'Fetching…',
    'controls.fetchSeedError': "Couldn't reach the randomness beacon — check your connection and try again.",
    'controls.applyRestart': 'Apply & restart',

    'stats.title': 'Stats',
    'stats.generation': 'Generation',
    'stats.step': 'Step',
    'stats.alive': 'Alive',
    'stats.lastGenSurvivors': 'Last gen survivors',
    'stats.survivorsPerGeneration': 'Survivors per generation',

    'inspector.creature': 'Creature #{uid}',
    'inspector.noLongerTracked': 'No longer tracked (its generation has ended).',
    'inspector.following': '📍 Following',
    'inspector.follow': '📍 Follow',
    'inspector.status': 'Status',
    'inspector.alive': 'Alive',
    'inspector.dead': 'Dead',
    'inspector.generation': 'Generation',
    'inspector.age': 'Age',
    'inspector.ageSteps': '{n} steps',
    'inspector.location': 'Location',
    'inspector.birthLocation': 'Birth location',
    'inspector.migrationDistance': 'Migration distance',
    'inspector.genomeLength': 'Genome length',
    'inspector.genomeLengthGenes': '{n} genes',
    'inspector.neuronsConnections': 'Neurons / connections',
    'inspector.responsiveness': 'Responsiveness',
    'inspector.lineage': 'Lineage',
    'inspector.originalGeneration': 'Original generation -- no parents.',
    'inspector.parentsGone': 'Parents no longer in the lineage log.',
    'inspector.genLabel': 'gen {gen} · #{uid}',
    'inspector.view': 'view',
    'inspector.directParents': 'Direct parents: #{p1}',
    'inspector.directParentsSecond': ', #{p2}',
    'inspector.asexual': ' (asexual)',
    'inspector.brain': 'Brain',
    'inspector.exportSvg': 'export SVG',
    'inspector.neuronEditHintCpu':
      "Click a neuron to pin it at a fixed value -- it'll stop reacting to its inputs for the rest of this creature's life.",
    'inspector.neuronEditHintGpu': 'Neuron editing requires the CPU backend (the GPU compute shader has no notion of a pinned neuron).',
    'inspector.neuronLabel': 'Neuron #{n}',
    'inspector.pinned': 'Pinned',
    'inspector.driven': 'Driven',
    'inspector.undriven': 'Undriven (bias)',
    'inspector.pinThisNeuron': 'Pin this neuron',
    'inspector.fixedOutputValue': 'Fixed output value',

    'learn.button': '📖 Learn',
    'learn.close': 'Close',
    'learn.title': 'Evolutionary concepts',
    'learn.subtitle': "What's actually happening in this simulation, explained.",
    'learn.inSimLabel': 'In this simulator',

    'challengeOption.0': 'Circle (west quadrant)',
    'challengeOption.1': 'Right half',
    'challengeOption.2': 'Right quarter',
    'challengeOption.3': 'Neighbor count (string)',
    'challengeOption.4': 'Center, weighted',
    'challengeOption.40': 'Center, unweighted',
    'challengeOption.5': 'Any corner',
    'challengeOption.6': 'Any corner, weighted',
    'challengeOption.7': 'Migrate distance',
    'challengeOption.8': 'Center, sparse',
    'challengeOption.9': 'Left eighth',
    'challengeOption.10': 'Radioactive walls',
    'challengeOption.11': 'Against any wall',
    'challengeOption.12': 'Touch any wall, ever',
    'challengeOption.13': 'East-West eighths',
    'challengeOption.14': 'Near a barrier',
    'challengeOption.15': 'Pairs',
    'challengeOption.16': 'Visit barriers in sequence',
    'challengeOption.17': 'Altruism (sacrifice zone)',

    'barrierOption.0': 'None',
    'barrierOption.1': 'Vertical bar (fixed)',
    'barrierOption.2': 'Vertical bar (random)',
    'barrierOption.3': 'Five staggered blocks',
    'barrierOption.4': 'Horizontal bar',
    'barrierOption.5': 'Floating island (moves each gen)',
    'barrierOption.6': 'Sequence of spots',

    'terrainOption.0': 'None',
    'terrainOption.1': 'Temperature gradient (cold→hot)',
    'terrainOption.2': 'Cold patch (center, slow)',
    'terrainOption.3': 'Hot patch (center, fast)',
    'terrainOption.4': 'Alternating cold/hot bands',
    'terrainOption.5': 'Random hot/cold spots',

    'topic.naturalSelection.title': 'Natural Selection',
    'topic.naturalSelection.tagline': "Survival and reproduction aren't random — they're earned.",
    'topic.naturalSelection.body':
      "Natural selection is simply this: individuals whose traits help them survive and reproduce in their environment tend to leave more offspring than individuals whose traits don't. Over many generations, helpful traits become more common and harmful ones rarer — not because anyone is choosing them, but because the math of unequal reproduction adds up. No foresight or intention is involved; it's a purely statistical consequence of variation, heredity, and differential survival.",
    'topic.naturalSelection.inSim':
      "The Selection challenge you pick (e.g. 'Any corner, weighted') is the entire environment here — it's the only thing deciding who gets to become a parent at the end of each generation. Change it and watch which behaviors start winning.",

    'topic.genotypePhenotype.title': 'Genotype & Phenotype',
    'topic.genotypePhenotype.tagline': "The blueprint isn't the building.",
    'topic.genotypePhenotype.body':
      "An organism's genotype is its genetic code; its phenotype is the actual observable organism that code produces — its body, its behavior. The same genotype, expressed through development, can produce very different phenotypes depending on how the genes interact. Evolution acts on phenotypes (does this creature survive?) but only genotypes get passed on.",
    'topic.genotypePhenotype.inSim':
      "A creature's genome — a flat list of genes — is its genotype. Each gene wires one connection in a tiny neural network; that network, once built, is the creature's 'brain' — its phenotype. Click any creature and open its Brain panel to see its phenotype made visible.",

    'topic.mutation.title': 'Mutation',
    'topic.mutation.tagline': 'Where new variation comes from.',
    'topic.mutation.body':
      "Mutation is a random change to genetic material — a copying error during reproduction. Most mutations do nothing or are mildly harmful, but occasionally one improves an organism's fit to its environment. Mutation is the only process that creates genuinely new genetic variation; every other evolutionary mechanism just reshuffles or filters what mutation has already produced.",
    'topic.mutation.inSim':
      "The Point mutation rate slider controls how often a random bit flips in a gene when a child genome is created. Set it to 0% and evolution has nothing new to work with — populations will only ever recombine their starting variation. Push it too high, and useful adaptations get scrambled before they can spread.",

    'topic.reproduction.title': 'Sexual vs. Asexual Reproduction',
    'topic.reproduction.tagline': "One parent's copy, or two parents' remix.",
    'topic.reproduction.body':
      "Asexual reproduction copies one parent's genes directly (plus mutation). Sexual reproduction combines genes from two parents, creating new combinations of already-existing variation every generation — a major source of diversity that doesn't require waiting for new mutations. The tradeoff: it also breaks apart combinations of genes that were working well together.",
    'topic.reproduction.inSim':
      'Toggle Sexual reproduction to switch between the two. With it on, each child genome is spliced together from two parents (with a bias toward fitter parents if Bias parent choice by fitness is also on); with it off, each child is a mutated copy of a single parent.',

    'topic.selectionPressure.title': 'Selection Pressure',
    'topic.selectionPressure.tagline': "The shape of 'good enough' keeps changing.",
    'topic.selectionPressure.body':
      "Selection pressure is any environmental factor that makes some traits more likely to survive and reproduce than others — predation, climate, food scarcity, competition. A trait that's an advantage under one pressure can be a liability under another; there's no universally 'best' organism, only ones well-suited to their current pressures.",
    'topic.selectionPressure.inSim':
      "Every Selection challenge is a different selection pressure. 'Radioactive walls' rewards staying near the center; 'Migrate distance' rewards constant movement. Switch challenges mid-run and watch a population that was well-adapted suddenly struggle.",

    'topic.geneticDrift.title': 'Genetic Drift',
    'topic.geneticDrift.tagline': "Sometimes you just get unlucky.",
    'topic.geneticDrift.body':
      "Not every death is about fitness. Genetic drift is the random fluctuation of gene frequencies from generation to generation, purely by chance — a perfectly fit individual can still die in an accident, and a mediocre one can get lucky. Drift's effect is strongest in small populations, where a few random deaths can meaningfully shift the whole gene pool; in large populations, it tends to average out.",
    'topic.geneticDrift.inSim':
      "Shrink the Population slider way down and watch survivor counts swing wildly between generations even with the same challenge — that's drift dominating over selection. With thousands of individuals, the same challenge produces much smoother, more predictable trends.",

    'topic.neuroevolution.title': 'Neuroevolution',
    'topic.neuroevolution.tagline': 'Brains that evolve instead of learn.',
    'topic.neuroevolution.body':
      'Neuroevolution uses evolutionary algorithms — selection, mutation, recombination — to design neural networks, instead of the gradient-descent training used in most modern AI. No individual creature ever learns anything during its life; instead, entire populations of networks compete across generations, and the wiring that works gets inherited.',
    'topic.neuroevolution.inSim':
      "This whole simulator is a neuroevolution experiment. Every creature's genome directly encodes its neural net's connections and weights (see Genotype & Phenotype); nothing is trained — only bred.",

    'topic.stigmergy.title': 'Stigmergy (Pheromone Communication)',
    'topic.stigmergy.tagline': "Coordinating without talking — through the environment itself.",
    'topic.stigmergy.body':
      "Stigmergy is indirect coordination between individuals through traces they leave in a shared environment, rather than through direct signals to each other — the classic example is an ant pheromone trail, where each ant's marking influences the paths later ants choose, without any ant ever 'communicating' with another directly.",
    'topic.stigmergy.inSim':
      'The Emit pheromone action lets a creature deposit a scent trail at its location; the pheromone-related sensors let other creatures detect and follow it. Turn on the pheromone overlay to watch trails form and fade in real time.',

    'topic.kinSelection.title': 'Kin Selection & Altruism',
    'topic.kinSelection.tagline': 'Helping relatives can be a winning genetic strategy.',
    'topic.kinSelection.body':
      "A gene that makes an individual sacrifice itself to help relatives can still spread, because relatives share copies of that same gene — helping them reproduce is, genetically, a roundabout way of reproducing yourself. This is kin selection, and it's the leading explanation for altruistic behavior in nature, from alarm calls to worker ants that never reproduce themselves.",
    'topic.kinSelection.inSim':
      "The Altruism challenge splits the world into a 'sacrifice zone' and a 'spawning zone.' Individuals in the spawning zone become parents; ones in the sacrifice zone don't reproduce at all — a direct, simplified test of whether self-sacrificing behavior can still be favored.",

    'topic.adaptation.title': 'Adaptation to Environment',
    'topic.adaptation.tagline': 'The same trait can help here and hurt there.',
    'topic.adaptation.body':
      'Adaptation is the process by which a population becomes better suited to its local environment over generations, through selection acting on heritable variation. Different environments favor different traits — thick fur in the cold, thin fur in the heat — and populations spread across varied environments often diverge accordingly.',
    'topic.adaptation.inSim':
      "Terrain patches carry a temperature that changes movement speed — cold is slow, hot is fast — and creatures can directly sense it. Try the 'Temperature gradient' terrain and see whether movement strategies start differing between the cold and hot sides of the world.",

    'topic.bottleneck.title': 'Population Bottlenecks',
    'topic.bottleneck.tagline': 'When almost everyone dies, evolution nearly starts over.',
    'topic.bottleneck.body':
      "A population bottleneck is a sharp, temporary drop in population size — from a disaster, disease, or a sudden change in environment — that can wipe out most of a population's genetic variation in one stroke, even if the survivors are just the lucky ones rather than the fittest ones. Recovery from a severe bottleneck can leave a population far less genetically diverse than before, for many generations after.",
    'topic.bottleneck.inSim':
      'If a Selection challenge is harsh enough that zero individuals pass it in a generation, this simulator treats it as a total extinction and restarts from scratch with fresh random genomes — the most extreme bottleneck possible. Watch the Survivors per generation chart for a sudden crash to zero.',
  },

  de: {
    'app.title': 'Evolutionssimulator',
    'app.tagline':
      'Interaktive Sandbox für natürliche Selektion — ein Webport von biosim4. Passe die Welt an und beobachte Generationen live bei der Evolution.',
    'app.runComplete': 'Lauf abgeschlossen — Generation {gen} erreicht.',
    'app.run50More': '50 weitere',
    'app.removeLimit': 'Limit entfernen',

    'header.themeLight': 'Hell',
    'header.themeDark': 'Dunkel',
    'header.themeSystem': 'System',
    'header.language': 'Sprache',

    'controls.title': 'Steuerung',
    'controls.pause': 'Pause',
    'controls.play': 'Start',
    'controls.step': 'Schritt',
    'controls.restartRun': 'Lauf neu starten',
    'controls.simSpeed': 'Simulationsgeschwindigkeit',
    'controls.simSpeedSingular': '{n} Schritt/Bild',
    'controls.simSpeedPlural': '{n} Schritte/Bild',
    'controls.maxGenerations': 'Max. Generationen (0 = unbegrenzt)',

    'controls.computeBackend': 'Recheneinheit',
    'controls.cpu': 'CPU',
    'controls.gpu': 'GPU',
    'controls.gpuChecking': '(prüfe…)',
    'controls.gpuUnavailable': '(nicht verfügbar)',
    'controls.gpuTitleUnavailable': 'WebGPU ist in diesem Browser nicht verfügbar',
    'controls.gpuTitleAvailable': 'Bündelt die Auswertung des neuronalen Netzes der gesamten Population auf der GPU',
    'controls.gpuHint':
      'Die GPU bündelt die Auswertung des neuronalen Netzes jeder Kreatur in einen einzigen Compute-Dispatch pro Schritt. Das lohnt sich vor allem bei großen Populationen; bei kleinen ist die CPU meist schneller.',

    'controls.selectionChallenge': 'Selektionsherausforderung',
    'controls.challengeHint':
      'Bestimmt, welche Kreaturen am Ende jeder Generation überleben und sich fortpflanzen. Wird erst in der nächsten Generation wirksam.',
    'controls.survivorPreview': 'Vorschau: Wer würde jetzt überleben',

    'controls.barriers': 'Barrieren',

    'controls.terrain': 'Terrain',
    'controls.terrainHint':
      'Kaltes Terrain (blau) verlangsamt die Bewegung, heißes Terrain (bernstein) beschleunigt sie — ein Ersatz für Schnee/Schlamm/Höhenlage. Blockiert nie vollständig wie Barrieren. Kreaturen können ihre aktuelle Terraintemperatur wahrnehmen.',

    'controls.genetics': 'Genetik',
    'controls.mutationRate': 'Punktmutationsrate',
    'controls.sexualReproduction': 'Sexuelle Fortpflanzung (zwei Elternteile)',
    'controls.biasByFitness': 'Elternwahl nach Fitness gewichten',
    'controls.allowKilling': 'Töten von Nachbarn erlauben',
    'controls.killTrueRng': 'Tötungsentscheidungen nutzen echten Zufall (drand/Cloudflare)',
    'controls.killTrueRngHint':
      'Jeder Tötungswurf stammt aus einem Strom, der zu Beginn jeder Generation mit einem echten drand-Beacon-Abruf neu geseedet wird (fällt bei fehlgeschlagenem Abruf auf den vorherigen Seed zurück).',

    'controls.sensing': 'Sinne',
    'controls.popSensorRadius': 'Radius Populationssensor',
    'controls.pheromoneSensorRadius': 'Radius Pheromonsensor',
    'controls.showPheromones': 'Pheromon-Overlay anzeigen',

    'controls.export': 'Export',
    'controls.pngSnapshot': 'PNG-Schnappschuss',
    'controls.configJson': 'Konfiguration (JSON)',
    'controls.statsCsv': 'Statistik (CSV)',
    'controls.stopRecording': '⏹ Aufnahme stoppen',
    'controls.recordVideo': '⏺ Video aufnehmen (WebM)',

    'controls.worldPopulation': 'Welt & Population (erfordert Neustart)',
    'controls.worldWidth': 'Weltbreite',
    'controls.worldHeight': 'Welthöhe',
    'controls.population': 'Population',
    'controls.initialGenomeLength': 'Anfängliche Genomlänge',
    'controls.maxGenomeLength': 'Maximale Genomlänge',
    'controls.maxNeurons': 'Max. interne Neuronen',
    'controls.deterministicRng': 'Deterministischer (geseedeter) Zufall',
    'controls.rngSeed': 'Zufalls-Seed',
    'controls.fetchTrueSeed': '🎲 Echter Zufalls-Seed (drand/Cloudflare)',
    'controls.fetchingSeed': 'Lädt…',
    'controls.fetchSeedError': 'Der Zufalls-Beacon war nicht erreichbar — Verbindung prüfen und erneut versuchen.',
    'controls.applyRestart': 'Übernehmen & neu starten',

    'stats.title': 'Statistik',
    'stats.generation': 'Generation',
    'stats.step': 'Schritt',
    'stats.alive': 'Lebendig',
    'stats.lastGenSurvivors': 'Überlebende letzte Gen.',
    'stats.survivorsPerGeneration': 'Überlebende pro Generation',

    'inspector.creature': 'Kreatur #{uid}',
    'inspector.noLongerTracked': 'Nicht mehr verfolgbar (die Generation ist beendet).',
    'inspector.following': '📍 Folgt',
    'inspector.follow': '📍 Folgen',
    'inspector.status': 'Status',
    'inspector.alive': 'Lebendig',
    'inspector.dead': 'Tot',
    'inspector.generation': 'Generation',
    'inspector.age': 'Alter',
    'inspector.ageSteps': '{n} Schritte',
    'inspector.location': 'Position',
    'inspector.birthLocation': 'Geburtsort',
    'inspector.migrationDistance': 'Wanderstrecke',
    'inspector.genomeLength': 'Genomlänge',
    'inspector.genomeLengthGenes': '{n} Gene',
    'inspector.neuronsConnections': 'Neuronen / Verbindungen',
    'inspector.responsiveness': 'Reaktionsfähigkeit',
    'inspector.lineage': 'Abstammung',
    'inspector.originalGeneration': 'Ursprüngliche Generation — keine Eltern.',
    'inspector.parentsGone': 'Eltern nicht mehr im Abstammungsprotokoll.',
    'inspector.genLabel': 'Gen. {gen} · #{uid}',
    'inspector.view': 'ansehen',
    'inspector.directParents': 'Direkte Eltern: #{p1}',
    'inspector.directParentsSecond': ', #{p2}',
    'inspector.asexual': ' (asexuell)',
    'inspector.brain': 'Gehirn',
    'inspector.exportSvg': 'SVG exportieren',
    'inspector.neuronEditHintCpu':
      'Klicke auf ein Neuron, um es auf einen festen Wert zu fixieren — es reagiert dann für den Rest des Lebens dieser Kreatur nicht mehr auf seine Eingaben.',
    'inspector.neuronEditHintGpu': 'Die Neuronenbearbeitung erfordert das CPU-Backend (der GPU-Compute-Shader kennt kein fixiertes Neuron).',
    'inspector.neuronLabel': 'Neuron #{n}',
    'inspector.pinned': 'Fixiert',
    'inspector.driven': 'Angetrieben',
    'inspector.undriven': 'Unangetrieben (Bias)',
    'inspector.pinThisNeuron': 'Dieses Neuron fixieren',
    'inspector.fixedOutputValue': 'Fester Ausgabewert',

    'learn.button': '📖 Lernen',
    'learn.close': 'Schließen',
    'learn.title': 'Evolutionäre Konzepte',
    'learn.subtitle': 'Was in dieser Simulation tatsächlich passiert, erklärt.',
    'learn.inSimLabel': 'In diesem Simulator',

    'challengeOption.0': 'Kreis (Westquadrant)',
    'challengeOption.1': 'Rechte Hälfte',
    'challengeOption.2': 'Rechtes Viertel',
    'challengeOption.3': 'Nachbarnanzahl (Kette)',
    'challengeOption.4': 'Zentrum, gewichtet',
    'challengeOption.40': 'Zentrum, ungewichtet',
    'challengeOption.5': 'Beliebige Ecke',
    'challengeOption.6': 'Beliebige Ecke, gewichtet',
    'challengeOption.7': 'Wanderdistanz',
    'challengeOption.8': 'Zentrum, spärlich',
    'challengeOption.9': 'Linkes Achtel',
    'challengeOption.10': 'Radioaktive Wände',
    'challengeOption.11': 'An einer beliebigen Wand',
    'challengeOption.12': 'Wand jemals berührt',
    'challengeOption.13': 'Ost-West-Achtel',
    'challengeOption.14': 'In Barrierennähe',
    'challengeOption.15': 'Paare',
    'challengeOption.16': 'Barrieren der Reihe nach besuchen',
    'challengeOption.17': 'Altruismus (Opferzone)',

    'barrierOption.0': 'Keine',
    'barrierOption.1': 'Vertikaler Balken (fest)',
    'barrierOption.2': 'Vertikaler Balken (zufällig)',
    'barrierOption.3': 'Fünf versetzte Blöcke',
    'barrierOption.4': 'Horizontaler Balken',
    'barrierOption.5': 'Schwimmende Insel (bewegt sich jede Gen.)',
    'barrierOption.6': 'Abfolge von Flecken',

    'terrainOption.0': 'Keines',
    'terrainOption.1': 'Temperaturverlauf (kalt→heiß)',
    'terrainOption.2': 'Kalte Zone (Zentrum, langsam)',
    'terrainOption.3': 'Heiße Zone (Zentrum, schnell)',
    'terrainOption.4': 'Abwechselnde Kalt/Heiß-Streifen',
    'terrainOption.5': 'Zufällige heiß/kalt-Flecken',

    'topic.naturalSelection.title': 'Natürliche Selektion',
    'topic.naturalSelection.tagline': 'Überleben und Fortpflanzung sind nicht zufällig — sie werden erarbeitet.',
    'topic.naturalSelection.body':
      'Natürliche Selektion bedeutet schlicht: Individuen, deren Merkmale ihnen helfen, in ihrer Umgebung zu überleben und sich fortzupflanzen, hinterlassen tendenziell mehr Nachkommen als Individuen, bei denen das nicht der Fall ist. Über viele Generationen hinweg werden hilfreiche Merkmale häufiger und schädliche seltener — nicht weil sie jemand auswählt, sondern weil sich die Mathematik ungleicher Fortpflanzung aufsummiert. Es steckt keine Voraussicht oder Absicht dahinter; es ist eine rein statistische Folge von Variation, Vererbung und unterschiedlichem Überleben.',
    'topic.naturalSelection.inSim':
      "Die gewählte Selektionsherausforderung (z. B. „Beliebige Ecke, gewichtet“) ist hier die gesamte Umwelt — sie entscheidet allein darüber, wer am Ende jeder Generation Elternteil wird. Ändere sie und beobachte, welches Verhalten plötzlich erfolgreich wird.",

    'topic.genotypePhenotype.title': 'Genotyp & Phänotyp',
    'topic.genotypePhenotype.tagline': 'Der Bauplan ist nicht das Gebäude.',
    'topic.genotypePhenotype.body':
      'Der Genotyp eines Organismus ist sein genetischer Code; der Phänotyp ist der tatsächlich beobachtbare Organismus, den dieser Code hervorbringt — sein Körper, sein Verhalten. Derselbe Genotyp kann je nach Ausprägung der Gene während der Entwicklung sehr unterschiedliche Phänotypen erzeugen. Evolution wirkt auf Phänotypen (überlebt diese Kreatur?), aber weitergegeben wird nur der Genotyp.',
    'topic.genotypePhenotype.inSim':
      'Das Genom einer Kreatur — eine flache Liste von Genen — ist ihr Genotyp. Jedes Gen verdrahtet eine Verbindung in einem winzigen neuronalen Netz; dieses Netz ist, einmal aufgebaut, das „Gehirn“ der Kreatur — ihr Phänotyp. Klicke auf eine Kreatur und öffne ihr Gehirn-Panel, um ihren Phänotyp sichtbar zu machen.',

    'topic.mutation.title': 'Mutation',
    'topic.mutation.tagline': 'Woher neue Variation kommt.',
    'topic.mutation.body':
      'Mutation ist eine zufällige Veränderung des Erbguts — ein Kopierfehler bei der Fortpflanzung. Die meisten Mutationen bewirken nichts oder sind leicht schädlich, aber gelegentlich verbessert eine die Anpassung eines Organismus an seine Umwelt. Mutation ist der einzige Prozess, der wirklich neue genetische Variation erzeugt; jeder andere evolutionäre Mechanismus mischt oder filtert nur das, was Mutation bereits hervorgebracht hat.',
    'topic.mutation.inSim':
      'Der Regler „Punktmutationsrate“ bestimmt, wie oft beim Erzeugen eines Kind-Genoms zufällig ein Bit in einem Gen kippt. Bei 0 % hat die Evolution nichts Neues, mit dem sie arbeiten kann — Populationen können nur ihre Startvariation neu kombinieren. Zu hoch eingestellt, werden nützliche Anpassungen zerstört, bevor sie sich verbreiten können.',

    'topic.reproduction.title': 'Sexuelle vs. asexuelle Fortpflanzung',
    'topic.reproduction.tagline': 'Die Kopie eines Elternteils oder der Remix von zweien.',
    'topic.reproduction.body':
      'Asexuelle Fortpflanzung kopiert die Gene eines Elternteils direkt (plus Mutation). Sexuelle Fortpflanzung kombiniert Gene von zwei Elternteilen und erzeugt so jede Generation neue Kombinationen bereits vorhandener Variation — eine wichtige Vielfaltsquelle, die nicht auf neue Mutationen warten muss. Der Preis: Sie zerlegt auch Genkombinationen, die gut zusammengewirkt haben.',
    'topic.reproduction.inSim':
      'Mit „Sexuelle Fortpflanzung“ schaltest du zwischen beiden um. Ist sie aktiv, wird jedes Kind-Genom aus zwei Elternteilen zusammengesetzt (mit Gewichtung zugunsten fitterer Eltern, wenn „Elternwahl nach Fitness gewichten“ ebenfalls aktiv ist); ist sie aus, ist jedes Kind eine mutierte Kopie eines einzelnen Elternteils.',

    'topic.selectionPressure.title': 'Selektionsdruck',
    'topic.selectionPressure.tagline': 'Was als „gut genug“ gilt, verändert sich ständig.',
    'topic.selectionPressure.body':
      'Selektionsdruck ist jeder Umweltfaktor, der manche Merkmale wahrscheinlicher überleben und sich fortpflanzen lässt als andere — Fressfeinde, Klima, Nahrungsknappheit, Konkurrenz. Ein Merkmal, das unter einem Druck ein Vorteil ist, kann unter einem anderen zur Belastung werden; es gibt keinen universell „besten“ Organismus, nur solche, die gut zu ihrem aktuellen Druck passen.',
    'topic.selectionPressure.inSim':
      'Jede Selektionsherausforderung ist ein anderer Selektionsdruck. „Radioaktive Wände“ belohnt Nähe zum Zentrum; „Wanderdistanz“ belohnt ständige Bewegung. Wechsle die Herausforderung mitten im Lauf und beobachte, wie eine gut angepasste Population plötzlich zu kämpfen hat.',

    'topic.geneticDrift.title': 'Gendrift',
    'topic.geneticDrift.tagline': 'Manchmal hat man einfach Pech.',
    'topic.geneticDrift.body':
      'Nicht jeder Tod hat mit Fitness zu tun. Gendrift ist die rein zufällige Schwankung von Genhäufigkeiten von Generation zu Generation — ein perfekt angepasstes Individuum kann trotzdem durch einen Unfall sterben, ein mittelmäßiges kann Glück haben. Der Effekt der Drift ist in kleinen Populationen am stärksten, wo wenige zufällige Tode den gesamten Genpool spürbar verschieben können; in großen Populationen gleicht er sich meist aus.',
    'topic.geneticDrift.inSim':
      'Verkleinere den Regler „Population“ stark und beobachte, wie die Überlebendenzahl selbst bei gleicher Herausforderung von Generation zu Generation stark schwankt — das ist Drift, die die Selektion überlagert. Mit Tausenden Individuen erzeugt dieselbe Herausforderung deutlich glattere, vorhersehbarere Verläufe.',

    'topic.neuroevolution.title': 'Neuroevolution',
    'topic.neuroevolution.tagline': 'Gehirne, die sich entwickeln, statt zu lernen.',
    'topic.neuroevolution.body':
      'Neuroevolution nutzt evolutionäre Algorithmen — Selektion, Mutation, Rekombination —, um neuronale Netze zu gestalten, statt des Gradientenabstiegs, mit dem die meisten modernen KI-Systeme trainiert werden. Keine einzelne Kreatur lernt während ihres Lebens irgendetwas; stattdessen konkurrieren ganze Populationen von Netzen über Generationen hinweg, und die Verdrahtung, die funktioniert, wird vererbt.',
    'topic.neuroevolution.inSim':
      'Dieser gesamte Simulator ist ein Neuroevolutions-Experiment. Das Genom jeder Kreatur kodiert direkt die Verbindungen und Gewichte ihres neuronalen Netzes (siehe „Genotyp & Phänotyp“); nichts wird trainiert — nur gezüchtet.',

    'topic.stigmergy.title': 'Stigmergie (Pheromonkommunikation)',
    'topic.stigmergy.tagline': 'Koordination ohne Worte — über die Umgebung selbst.',
    'topic.stigmergy.body':
      'Stigmergie ist indirekte Koordination zwischen Individuen über Spuren, die sie in einer gemeinsamen Umgebung hinterlassen, statt über direkte Signale aneinander — das klassische Beispiel ist eine Ameisen-Pheromonspur, bei der die Markierung jeder Ameise die Wege späterer Ameisen beeinflusst, ohne dass je eine Ameise direkt mit einer anderen „kommuniziert“.',
    'topic.stigmergy.inSim':
      'Die Aktion „Pheromon aussenden“ lässt eine Kreatur an ihrem Standort eine Duftspur hinterlassen; die pheromonbezogenen Sensoren lassen andere Kreaturen sie erkennen und ihr folgen. Aktiviere das Pheromon-Overlay, um zu beobachten, wie Spuren in Echtzeit entstehen und verblassen.',

    'topic.kinSelection.title': 'Verwandtenselektion & Altruismus',
    'topic.kinSelection.tagline': 'Verwandten zu helfen kann eine erfolgreiche genetische Strategie sein.',
    'topic.kinSelection.body':
      'Ein Gen, das ein Individuum dazu bringt, sich für Verwandte zu opfern, kann sich trotzdem verbreiten, weil Verwandte Kopien desselben Gens tragen — ihnen zur Fortpflanzung zu verhelfen ist genetisch gesehen ein Umweg, sich selbst fortzupflanzen. Das ist Verwandtenselektion, die führende Erklärung für altruistisches Verhalten in der Natur, von Warnrufen bis zu Arbeiterinnen, die sich selbst nie fortpflanzen.',
    'topic.kinSelection.inSim':
      'Die Herausforderung „Altruismus“ teilt die Welt in eine „Opferzone“ und eine „Fortpflanzungszone“. Individuen in der Fortpflanzungszone werden Elternteile; die in der Opferzone pflanzen sich gar nicht fort — ein direkter, vereinfachter Test, ob selbstaufopferndes Verhalten trotzdem begünstigt werden kann.',

    'topic.adaptation.title': 'Anpassung an die Umwelt',
    'topic.adaptation.tagline': 'Dasselbe Merkmal kann hier helfen und dort schaden.',
    'topic.adaptation.body':
      'Anpassung ist der Prozess, durch den eine Population über Generationen hinweg besser zu ihrer lokalen Umwelt passt, weil Selektion auf vererbbare Variation wirkt. Unterschiedliche Umgebungen begünstigen unterschiedliche Merkmale — dickes Fell in der Kälte, dünnes in der Hitze —, und über verschiedene Umgebungen verteilte Populationen entwickeln sich entsprechend oft auseinander.',
    'topic.adaptation.inSim':
      'Terrain-Flecken tragen eine Temperatur, die die Bewegungsgeschwindigkeit verändert — kalt ist langsam, heiß ist schnell —, und Kreaturen können das direkt wahrnehmen. Probiere den Terraintyp „Temperaturverlauf“ aus und beobachte, ob sich die Bewegungsstrategien zwischen der kalten und der heißen Seite der Welt unterscheiden.',

    'topic.bottleneck.title': 'Populationsengpässe',
    'topic.bottleneck.tagline': 'Wenn fast alle sterben, beginnt die Evolution fast von vorn.',
    'topic.bottleneck.body':
      'Ein Populationsengpass ist ein scharfer, vorübergehender Einbruch der Populationsgröße — durch eine Katastrophe, eine Krankheit oder einen plötzlichen Umweltwandel —, der einen Großteil der genetischen Variation einer Population auf einen Schlag auslöschen kann, selbst wenn die Überlebenden nur Glückspilze und nicht die am besten Angepassten sind. Die Erholung von einem schweren Engpass kann eine Population noch viele Generationen lang deutlich weniger genetisch vielfältig hinterlassen als zuvor.',
    'topic.bottleneck.inSim':
      'Ist eine Selektionsherausforderung so hart, dass in einer Generation null Individuen sie bestehen, behandelt dieser Simulator das als vollständiges Aussterben und startet mit frischen, zufälligen Genomen neu — der extremstmögliche Engpass. Achte im Diagramm „Überlebende pro Generation“ auf einen plötzlichen Absturz auf null.',
  },
};
