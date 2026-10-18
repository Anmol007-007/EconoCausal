import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ScreenTab } from './types.ts';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { ExportModal } from './components/ExportModal.tsx';
import { ApiDocsModal } from './components/ApiDocsModal.tsx';
import { PipelineRunnerModal } from './components/PipelineRunnerModal.tsx';
import { UploadPipelineView } from './components/UploadPipelineView.tsx';
import { CausalDiagnosticsView } from './components/CausalDiagnosticsView.tsx';
import { UpliftQiniView } from './components/UpliftQiniView.tsx';
import { BudgetAllocationView } from './components/BudgetAllocationView.tsx';
import { ExecutiveDriftView } from './components/ExecutiveDriftView.tsx';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ScreenTab>('upload-pipeline');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isApiDocsModalOpen, setIsApiDocsModalOpen] = useState(false);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);

  const [totalBudget, setTotalBudget] = useState<number>(5000);
  const [unitMargin, setUnitMargin] = useState<number>(45);

  const handleRunPipeline = () => {
    setIsPipelineModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f0fbff] text-[#131d20]">
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenApiDocs={() => setIsApiDocsModalOpen(true)}
        onRunPipeline={handleRunPipeline}
        isPipelineRunning={isPipelineRunning}
      />

      <main className="w-full pt-36 pb-12 flex-1 flex flex-col">
        <div className="w-full max-w-[1780px] mx-auto px-6 sm:px-10 xl:px-14 flex flex-col gap-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="w-full"
            >
              {currentTab === 'upload-pipeline' && (
                <UploadPipelineView
                  onNavigate={setCurrentTab}
                  onRunPipeline={handleRunPipeline}
                  isPipelineRunning={isPipelineRunning}
                  totalBudget={totalBudget}
                  setTotalBudget={setTotalBudget}
                  unitMargin={unitMargin}
                  setUnitMargin={setUnitMargin}
                />
              )}

              {currentTab === 'causal-diagnostics' && (
                <CausalDiagnosticsView onNavigate={setCurrentTab} />
              )}

              {currentTab === 'uplift-qini' && (
                <UpliftQiniView onNavigate={setCurrentTab} />
              )}

              {currentTab === 'budget-allocation' && (
                <BudgetAllocationView
                  onNavigate={setCurrentTab}
                  totalBudget={totalBudget}
                  setTotalBudget={setTotalBudget}
                  unitMargin={unitMargin}
                  setUnitMargin={setUnitMargin}
                />
              )}

              {currentTab === 'executive-summary-drift' && (
                <ExecutiveDriftView
                  onNavigate={setCurrentTab}
                  onOpenExportModal={() => setIsExportModalOpen(true)}
                  totalBudget={totalBudget}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Footer />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <ApiDocsModal
        isOpen={isApiDocsModalOpen}
        onClose={() => setIsApiDocsModalOpen(false)}
      />

      <PipelineRunnerModal
        isOpen={isPipelineModalOpen}
        onClose={() => setIsPipelineModalOpen(false)}
        onNavigateToTab={setCurrentTab}
      />
    </div>
  );
}
