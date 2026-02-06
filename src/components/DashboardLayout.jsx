import { DashboardProvider, useDashboard } from '../contexts/DashboardContext';
import Sidebar from './Sidebar';
import Footer from './Footer';

function DashboardLayoutContent({ children }) {
    const { activeView, setActiveView } = useDashboard();

    return (
        <div className="min-h-screen bg-[var(--bg-main)] relative flex overflow-hidden">

            <Sidebar activeView={activeView} setActiveView={setActiveView} />

            <div className="flex-1 flex flex-col min-w-0 lg:ml-80 relative z-10 p-6 min-h-screen">
                <div className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-[48px] flex flex-col shadow-2xl backdrop-blur-md min-h-full overflow-hidden">
                    <main className="flex-1 flex flex-col p-8">
                        {children}
                    </main>
                    <Footer />
                </div>
            </div>
        </div>
    );
}

export default function DashboardLayout({ children }) {
    return (
        <DashboardProvider>
            <DashboardLayoutContent>
                {children}
            </DashboardLayoutContent>
        </DashboardProvider>
    );
}
