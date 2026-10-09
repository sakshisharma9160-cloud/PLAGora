import { HistoryItem, ScanReport } from '../types/detector';
import { runPlagiarismDetection } from '../engine/pipeline';
import { getInitialCorpus, PRESET_SUBMISSIONS } from './sampleCorpus';

export function getSampleHistory(): HistoryItem[] {
  const corpus = getInitialCorpus();
  const defaultConfig = {
    shingleK: 5,
    windowSizeW: 4,
    minMatchWords: 5,
    semanticThreshold: 0.78,
    maskQuotes: true,
    maskReferences: true,
    whitelistText: '',
    enableSemantic: true,
    enableCodeNormalization: true,
    enableStylometry: true,
    enableSLM: true
  };

  // Run reports for 3 presets so history has real working reports!
  const report1 = runPlagiarismDetection(
    'NLP Seminar - Attention Mechanisms Review',
    PRESET_SUBMISSIONS[0].text,
    corpus,
    defaultConfig
  );

  const report2 = runPlagiarismDetection(
    'Marine Ecology Term Paper - Coral Reefs',
    PRESET_SUBMISSIONS[1].text,
    corpus,
    defaultConfig
  );

  const report3 = runPlagiarismDetection(
    'Honors Thesis - Quantum Computing Paradigms',
    PRESET_SUBMISSIONS[4].text,
    corpus,
    defaultConfig
  );

  const report4 = runPlagiarismDetection(
    'CS301 Assignment - BST Tree Operations',
    PRESET_SUBMISSIONS[3].text,
    corpus,
    defaultConfig
  );

  return [
    {
      id: 'hist-001',
      title: 'NLP Seminar - Attention Mechanisms Review',
      timestamp: '2026-10-06T08:15:00.000Z',
      wordCount: PRESET_SUBMISSIONS[0].text.split(/\s+/).length,
      plagiarismPercent: report1.overallSimilarityPercent,
      originalPercent: Math.max(0, 100 - report1.overallSimilarityPercent),
      similarityScore: report1.overallSimilarityPercent,
      matchedSourcesCount: report1.topSources.length,
      topSourceName: report1.topSources[0]?.docTitle || 'None',
      report: report1
    },
    {
      id: 'hist-002',
      title: 'Marine Ecology Term Paper - Coral Reefs',
      timestamp: '2026-10-05T14:30:00.000Z',
      wordCount: PRESET_SUBMISSIONS[1].text.split(/\s+/).length,
      plagiarismPercent: report2.overallSimilarityPercent,
      originalPercent: Math.max(0, 100 - report2.overallSimilarityPercent),
      similarityScore: report2.overallSimilarityPercent,
      matchedSourcesCount: report2.topSources.length,
      topSourceName: report2.topSources[0]?.docTitle || 'None',
      report: report2
    },
    {
      id: 'hist-003',
      title: 'Honors Thesis - Quantum Computing Paradigms',
      timestamp: '2026-10-04T11:20:00.000Z',
      wordCount: PRESET_SUBMISSIONS[4].text.split(/\s+/).length,
      plagiarismPercent: report3.overallSimilarityPercent,
      originalPercent: Math.max(0, 100 - report3.overallSimilarityPercent),
      similarityScore: report3.overallSimilarityPercent,
      matchedSourcesCount: report3.topSources.length,
      topSourceName: 'None (Clean Document)',
      report: report3
    },
    {
      id: 'hist-004',
      title: 'CS301 Assignment - BST Tree Operations',
      timestamp: '2026-10-03T16:45:00.000Z',
      wordCount: PRESET_SUBMISSIONS[3].text.split(/\s+/).length,
      plagiarismPercent: report4.overallSimilarityPercent,
      originalPercent: Math.max(0, 100 - report4.overallSimilarityPercent),
      similarityScore: report4.overallSimilarityPercent,
      matchedSourcesCount: report4.topSources.length,
      topSourceName: report4.topSources[0]?.docTitle || 'None',
      report: report4
    }
  ];
}
