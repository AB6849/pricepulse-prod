import React, { useEffect } from 'react';
import feather from 'feather-icons';

export default function PrivacyPolicy() {
    useEffect(() => {
        feather.replace();
    }, []);

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-white p-8 md:p-16 overflow-y-auto">
            <div className="max-w-4xl mx-auto glass-card p-10 mt-10 shadow-2xl relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <i data-feather="shield" className="w-6 h-6 text-indigo-400"></i>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                        Last Updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>

                <div className="space-y-8 text-zinc-300 leading-relaxed text-sm md:text-base relative z-10">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. Introduction</h2>
                        <p>
                            Welcome to Traben. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy will inform you as to how we look after your personal data when you visit our
                            website and use our services, and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. The Data We Collect About You</h2>
                        <p className="mb-2">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data:</strong> includes email address.</li>
                            <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
                            <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. How We Use Your Personal Data</h2>
                        <p className="mb-2">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                            <li>To manage your account and provide you with customer support.</li>
                            <li>To notify you about changes to our terms or privacy policy.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Data Security</h2>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost,
                            used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data
                            to those employees, agents, contractors and other third parties who have a business need to know.
                            They will only process your personal data on our instructions and they are subject to a duty of confidentiality.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. Data Retention</h2>
                        <p>
                            We will only retain your personal data for as long as reasonably necessary to fulfil the purposes we collected it for,
                            including for the purposes of satisfying any legal, regulatory, tax, accounting or reporting requirements. We may retain
                            your personal data for a longer period in the event of a complaint or if we reasonably believe there is a prospect of
                            litigation in respect to our relationship with you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. Your Legal Rights</h2>
                        <p className="mb-2">Under certain circumstances, you have rights under data protection laws in relation to your personal data. You have the right to:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Request access to your personal data.</li>
                            <li>Request correction of your personal data.</li>
                            <li>Request erasure of your personal data.</li>
                            <li>Object to processing of your personal data.</li>
                            <li>Request restriction of processing your personal data.</li>
                            <li>Request transfer of your personal data.</li>
                            <li>Right to withdraw consent.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">7. Contact Us</h2>
                        <p>
                            If you have any questions about this privacy policy or our privacy practices, please contact us at:{' '}
                            <a href="mailto:traben.help@gmail.com" className="text-indigo-400 hover:text-indigo-300 underline font-medium">traben.help@gmail.com</a>.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-6 border-t border-white/10 text-center">
                    <a href="https://www.traben.online/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors border border-white/5">
                        <i data-feather="arrow-left" className="w-4 h-4"></i>
                        Return to Traben
                    </a>
                </div>
            </div>
        </div>
    );
}
