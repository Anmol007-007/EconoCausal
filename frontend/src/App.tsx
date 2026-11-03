import React, { useState, useEffect } from 'react';
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
import { LiveMetricsView } from './components/LiveMetricsView.tsx';
import { ModelComparisonView } from './components/ModelComparisonView.tsx';
import { ShapExplainabilityView } from './components/ShapExplainabilityView.tsx';
import { SegmentExplorerView } from './components/SegmentExplorerView.tsx';
import { RoiSimulatorView } from './components/RoiSimulatorView.tsx';
import { NotificationsPanel } from './components/NotificationsPanel.tsx';
import { SettingsPanel } from './components/SettingsPanel.tsx';
import { GlobalSearch } from './components/GlobalSearch.tsx';
import { MobileMenu } from './components/MobileMenu.tsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
import { OfflineBanner } from './components/ui/OfflineBanner.tsx';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ScreenTab>('upload-pipeline');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isApiDocsModalOpen, setIsApiDocsModalOpen] = useState(false);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);

  // New panels for Day 12 & Day 13
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [totalBudget, setTotalBudget] = useState<number>(5000);
  const [unitMargin, setUnitMargin] = useState<number>(45);

  const handleRunPipeline = () => {
    setIsPipelineModalOpen(true);
  };

  // Keyboard shortcut listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f0fbff] dark:bg-[#0d1b1e] text-[#131d20] dark:text-[#e2ecef] transition-colors duration-150">
      <OfflineBanner />

      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenApiDocs={() => setIsApiDocsModalOpen(true)}
        onRunPipeline={handleRunPipeline}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isPipelineRunning={isPipelineRunning}
        onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <main id="main-content" className="w-full pt-32 sm:pt-36 pb-12 flex-1 flex flex-col">
        <div className="w-full max-w-[1780px] mx-auto px-4 sm:px-8 xl:px-12 flex flex-col gap-8">
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
                <ErrorBoundary viewName="Upload & Pipeline">
                  <UploadPipelineView
                    onNavigate={setCurrentTab}
                    onRunPipeline={handleRunPipeline}
                    isPipelineRunning={isPipelineRunning}
                    totalBudget={totalBudget}
                    setTotalBudget={setTotalBudget}
                    unitMargin={unitMargin}
                    setUnitMargin={setUnitMargin}
                  />
                </ErrorBoundary>
              )}

              {currentTab === 'causal-diagnostics' && (
                <ErrorBoundary viewName="Causal Diagnostics">
                  <CausalDiagnosticsView onNavigate={setCurrentTab} />
                </ErrorBoundary>
              )}

              {currentTab === 'uplift-qini' && (
                <ErrorBoundary viewName="Uplift & Qini">
                  <UpliftQiniView onNavigate={setCurrentTab} />
                </ErrorBoundary>
              )}

              {currentTab === 'budget-allocation' && (
                <ErrorBoundary viewName="Budget Allocation">
                  <BudgetAllocationView
                    onNavigate={setCurrentTab}
                    totalBudget={totalBudget}
                    setTotalBudget={setTotalBudget}
                    unitMargin={unitMargin}
                    setUnitMargin={setUnitMargin}
                  />
                </ErrorBoundary>
              )}

              {currentTab === 'executive-summary-drift' && (
                <ErrorBoundary viewName="Executive Summary & Drift">
                  <ExecutiveDriftView
                    onNavigate={setCurrentTab}
                    onOpenExportModal={() => setIsExportModalOpen(true)}
                    totalBudget={totalBudget}
                  />
                </ErrorBoundary>
              )}

              {currentTab === 'live-metrics' && (
                <ErrorBoundary viewName="Live Metrics">
                  <LiveMetricsView onNavigate={setCurrentTab} />
                </ErrorBoundary>
              )}

              {currentTab === 'model-comparison' && (
                <ErrorBoundary viewName="Model Comparison">
                  <ModelComparisonView onNavigate={setCurrentTab} />
                </ErrorBoundary>
              )}

              {currentTab === 'shap-explainability' && (
                <ErrorBoundary viewName="SHAP Explainability">
                  <ShapExplainabilityView onNavigate={setCurrentTab} />
                </ErrorBoundary>
              )}

              {currentTab === 'segment-explorer' && (
                <ErrorBoundary viewName="Segment Explorer">
                  <SegmentExplorerView onNavigate={setCurrentTab} />
                </ErrorBoundary>
              )}

              {currentTab === 'roi-simulator' && (
                <ErrorBoundary viewName="ROI Simulator">
                  <RoiSimulatorView
                    onNavigate={setCurrentTab}
                    totalBudget={totalBudget}
                    setTotalBudget={setTotalBudget}
                    unitMargin={unitMargin}
                    setUnitMargin={setUnitMargin}
                  />
                </ErrorBoundary>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Footer />

      {/* Global Modals & Slide-out Panels */}
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

      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTab={setCurrentTab}
        onRunPipeline={handleRunPipeline}
        onOpenApiDocs={() => setIsApiDocsModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onRunPipeline={handleRunPipeline}
        onOpenApiDocs={() => setIsApiDocsModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isPipelineRunning={isPipelineRunning}
        isBackendLive={null}
      />
    </div>
  );
}
