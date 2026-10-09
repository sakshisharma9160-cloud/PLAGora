import { DocumentRecord, BenchmarkCase } from '../types/detector';
import { tokenizeWithOffsets } from '../engine/textUtils';
import { generateShingles, computeMinHashSignature } from '../engine/winnowing';

const BASE_CORPUS_DATA = [
  {
    id: 'corpus-doc-1',
    title: 'Deep Learning Foundations and Transformer Attention Mechanisms',
    author: 'Dr. Evelyn Vance (2022)',
    category: 'academic' as const,
    content: `The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.

Attention can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.

In scaled dot-product attention, the input consists of queries and keys of dimension d_k, and values of dimension d_v. We compute the dot products of the query with all keys, divide each by the square root of d_k, and apply a softmax function to obtain the weights on the values. Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.

Self-attention, sometimes called intra-attention, is an attention mechanism relating different positions of a single sequence in order to compute a representation of the sequence. Self-attention has been used successfully in a variety of tasks including reading comprehension, abstractive summarization, textual entailment and learning task-independent sentence representations.`
  },
  {
    id: 'corpus-doc-2',
    title: 'Ocean Acidification and Marine Biodiversity in Coral Reef Ecosystems',
    author: 'Prof. Marcus Thorne (2021)',
    category: 'academic' as const,
    content: `Ocean acidification represents one of the most critical anthropogenic threats to marine biodiversity. The uptake of excess atmospheric carbon dioxide by oceanic surface waters drives fundamental changes in marine seawater chemistry. When carbon dioxide dissolves in water, it forms carbonic acid, which dissociates into hydrogen ions and bicarbonate ions, driving down oceanic pH levels.

Coral reef ecosystems are exceptionally vulnerable to these chemical shifts. Scleractinian corals rely on the saturation state of calcium carbonate minerals, specifically aragonite, to deposit their rigid calcium skeletons. As hydrogen ion concentrations escalate, carbonate ions bond with free protons to form bicarbonate, depleting the ambient carbonate pool required for calcification.

Laboratory and field assessments demonstrate that sustained calcification declines disrupt coral structural stability. Reduced calcification weakens the skeletal density of branching and massive corals, increasing vulnerability to bioerosion and physical wave damage. Furthermore, larval settlement behavior and post-settlement metamorphosis of juvenile corals exhibit marked deterioration under elevated seawater pCO2 regimes.`
  },
  {
    id: 'corpus-doc-3',
    title: 'Implementation and Invariants of Balanced Binary Search Trees',
    author: 'CS301 Algorithm Laboratory (2023)',
    category: 'code' as const,
    content: `A binary search tree satisfies the invariant that for every node with key k, all elements stored in its left subtree have keys strictly less than k, and all elements in its right subtree have keys strictly greater than k.

class BSTNode:
    def __init__(self, key, value):
        self.key = key
        self.value = value
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None

    def insert(self, key, value):
        if self.root is None:
            self.root = BSTNode(key, value)
            return True
        curr = self.root
        while curr:
            if key == curr.key:
                curr.value = value
                return False
            elif key < curr.key:
                if curr.left is None:
                    curr.left = BSTNode(key, value)
                    return True
                curr = curr.left
            else:
                if curr.right is None:
                    curr.right = BSTNode(key, value)
                    return True
                curr = curr.right

    def search(self, key):
        curr = self.root
        while curr:
            if key == curr.key:
                return curr.value
            elif key < curr.key:
                curr = curr.left
            else:
                curr = curr.right
        return None`
  },
  {
    id: 'corpus-doc-4',
    title: 'Economic Disruption and Urban Labor Dynamics in 19th Century Britain',
    author: 'Dr. Arthur Pendelton (2019)',
    category: 'academic' as const,
    content: `The Industrial Revolution in Great Britain precipitated an unprecedented structural reallocation of human capital from rural agrarian subsistence toward centralized mechanized urban factories. The rapid mechanization of textile spinning and weaving displaced traditional artisan cottage industries, creating widespread technological unemployment among handloom weavers while stimulating fierce demand for factory operatives in Lancashire and Yorkshire.

Urban demographic expansion far outpaced infrastructural development in early industrial centers such as Manchester, Birmingham, and Leeds. Overcrowded tenements, inadequate municipal sanitation, and contaminated water supplies fostered recurrent epidemics of cholera and typhus. Despite real wages experiencing marginal secular increases by the mid-19th century, standard-of-living debates emphasize that biological indicators such as average adult height and childhood life expectancy declined during the peak decades of industrial urbanization.`
  }
];

export function getInitialCorpus(): DocumentRecord[] {
  return BASE_CORPUS_DATA.map(doc => {
    const tokens = tokenizeWithOffsets(doc.content);
    const shingles = generateShingles(tokens, 5);
    const minHash = computeMinHashSignature(shingles.map(s => s.hash));

    return {
      id: doc.id,
      title: doc.title,
      author: doc.author,
      category: doc.category,
      content: doc.content,
      createdAt: '2024-01-15T00:00:00.000Z',
      tokenCount: tokens.length,
      fingerprintCount: shingles.length,
      minHashSig: minHash
    };
  });
}

export interface PresetSubmission {
  id: string;
  name: string;
  description: string;
  text: string;
  whitelistPrompt?: string;
}

export const PRESET_SUBMISSIONS: PresetSubmission[] = [
  {
    id: 'sub-exact-copy',
    name: 'Direct Copy-Paste (Transformer Architecture)',
    description: 'Verbatim text lifted from Transformer attention mechanisms paper with one sentence modified.',
    text: `Recent developments in natural language processing have revolutionized the state of the art.

The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.

Attention can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.

These innovations demonstrate why modern neural translation tools achieve unprecedented bilingual evaluation understudies across benchmark translations.`
  },
  {
    id: 'sub-paraphrase-heavy',
    name: 'Heavy Paraphrase & Synonym Swap (Ocean Acidification)',
    description: 'Same technical claims and structure as marine ecosystem paper, but reworded using synonyms.',
    text: `Marine acidification stands as one of the most vital anthropogenic hazards to ocean biological diversity. The absorption of excess atmospheric carbon dioxide by sea surface waters drives critical changes in oceanic chemical composition. When carbon dioxide dissolves in water, it forms carbonic acid, which dissociates into hydrogen ions and bicarbonate ions, decreasing oceanic pH levels.

Coral reef ecosystems are particularly vulnerable to these chemical changes. Hard corals depend on the saturation state of calcium carbonate minerals, specifically aragonite, to construct their solid calcium frameworks. As hydrogen ion concentrations surge, carbonate ions bond with free protons to form bicarbonate, depleting the surrounding carbonate pool needed for calcification.`
  },
  {
    id: 'sub-mixed-with-quotes',
    name: 'Mixed Essay with Quoted Text & Boilerplate Whitelist',
    description: 'Contains a legitimate quoted passage ("..."), prompt boilerplate, copied text, and original thoughts.',
    whitelistPrompt: `ESSAY PROMPT: Discuss the demographic and economic transformations in nineteenth-century Britain with reference to industrial urbanization and public health.`,
    text: `ESSAY PROMPT: Discuss the demographic and economic transformations in nineteenth-century Britain with reference to industrial urbanization and public health.

The historical impact of industrialization remains a subject of vigorous debate among contemporary historians.

As Dr. Arthur Pendelton accurately observed in his seminal study:
"The Industrial Revolution in Great Britain precipitated an unprecedented structural reallocation of human capital from rural agrarian subsistence toward centralized mechanized urban factories."

However, we must also examine the epidemiological consequences in dense municipalities:
Urban demographic expansion far outpaced infrastructural development in early industrial centers such as Manchester, Birmingham, and Leeds. Overcrowded tenements, inadequate municipal sanitation, and contaminated water supplies fostered recurrent epidemics of cholera and typhus.

In my view, while economic productivity surged exponentially, public health regulations lagged nearly two generations behind modern sanitation standards.

References:
[1] Pendelton, A. (2019). Economic Disruption and Urban Labor Dynamics in 19th Century Britain. Journal of Historical Economics, 42(3), 112-135.`
  },
  {
    id: 'sub-code-clone',
    name: 'Source Code Clone (Renamed Variables & Clean Comments)',
    description: 'Binary Search Tree code with renamed variables (root -> root_ptr, key -> target_val).',
    text: `# Student submission: Binary Search Tree Data Structure
class BSTNode:
    def __init__(self, key, value):
        self.key = key
        self.value = value
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root_ptr = None

    def insert(self, target_val, node_data):
        if self.root_ptr is None:
            self.root_ptr = BSTNode(target_val, node_data)
            return True
        curr_ptr = self.root_ptr
        while curr_ptr:
            if target_val == curr_ptr.key:
                curr_ptr.value = node_data
                return False
            elif target_val < curr_ptr.key:
                if curr_ptr.left is None:
                    curr_ptr.left = BSTNode(target_val, node_data)
                    return True
                curr_ptr = curr_ptr.left
            else:
                if curr_ptr.right is None:
                    curr_ptr.right = BSTNode(target_val, node_data)
                    return True
                curr_ptr = curr_ptr.right`
  },
  {
    id: 'sub-clean-original',
    name: 'Genuine Original Work (Clean Control)',
    description: 'Completely novel writing with zero overlap with corpus documents.',
    text: `Quantum computing leverages quantum mechanical phenomena such as superposition and entanglement to execute calculations intractable for classical computers. Unlike classical bits which exist in binary states of zero or one, quantum bits or qubits can inhabit linear superpositions of multiple basis states simultaneously.

Physical realization of fault-tolerant quantum computation requires quantum error correction codes like surface codes, which spread quantum information across an ensemble of physical qubits to protect against environmental decoherence and thermal noise.`
  }
];

export const BENCHMARK_TEST_SUITE: BenchmarkCase[] = [
  {
    id: 'bench-pan-01',
    title: 'PAN Shared Task: Verbatim Text Copy (64 words)',
    dataset: 'PAN',
    submissionText: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    sourceText: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    groundTruthPlagiarized: true,
    groundTruthType: 'exact'
  },
  {
    id: 'bench-pan-02',
    title: 'PAN Shared Task: Light Word Swapping & Insertions',
    dataset: 'PAN',
    submissionText: 'The dominant sequential models are rooted in intricate recurrent networks containing an encoder and decoder. High-performing systems link the encoder and decoder via an attention mechanism. We put forward a simplified network framework, the Transformer, relying strictly on attention mechanisms, eliminating recurrence and convolution.',
    sourceText: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    groundTruthPlagiarized: true,
    groundTruthType: 'light_edit'
  },
  {
    id: 'bench-mrpc-01',
    title: 'MRPC Paraphrase: High Semantic Similarity, Different Lexical Terms',
    dataset: 'MRPC',
    submissionText: 'Marine acidification represents one of the most critical hazards to ocean biodiversity as carbon dioxide absorption elevates seawater acidity and reduces carbonate ion availability.',
    sourceText: 'Ocean acidification represents one of the most critical anthropogenic threats to marine biodiversity. The uptake of excess atmospheric carbon dioxide by oceanic surface waters drives fundamental changes in marine seawater chemistry.',
    groundTruthPlagiarized: true,
    groundTruthType: 'heavy_paraphrase'
  },
  {
    id: 'bench-pan-03',
    title: 'Clean Negative Control (Distinct Subject)',
    dataset: 'PAN',
    submissionText: 'Photosynthesis is the biological process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organism activities.',
    sourceText: 'The Industrial Revolution in Great Britain precipitated an unprecedented structural reallocation of human capital from rural agrarian subsistence toward centralized mechanized urban factories.',
    groundTruthPlagiarized: false,
    groundTruthType: 'clean'
  },
  {
    id: 'bench-code-01',
    title: 'Code Clone: Renamed Identifiers and Structural Equivalence',
    dataset: 'Code-Clone',
    submissionText: 'def insert(self, key_val, payload):\n    if self.head is None:\n        self.head = Node(key_val, payload)\n        return True',
    sourceText: 'def insert(self, key, value):\n    if self.root is None:\n        self.root = BSTNode(key, value)\n        return True',
    groundTruthPlagiarized: true,
    groundTruthType: 'exact'
  }
];
