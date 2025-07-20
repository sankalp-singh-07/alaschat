'use client';

import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import {
	Upload,
	MessageSquare,
	Eye,
	TrendingUp,
	Zap,
	Shield,
	Users,
} from 'lucide-react';

export default function Home() {
	const { user, isLoaded } = useUser();

	useEffect(() => {
		if (isLoaded && user) {
			redirect('/chat');
		}
	}, [isLoaded, user]);

	return (
		<>
			<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 relative">
				<section className="w-full px-4 py-8 mx-auto max-w-6xl sm:px-6 lg:px-8 flex flex-col items-center space-y-16 text-center">
					<header className="space-y-6 md:space-y-8">
						<h1 className="text-6xl font-bold tracking-tight sm:text-8xl lg:text-9xl text-black dark:text-white">
							ALASCHAT
							<span className="text-blue-600 dark:text-blue-400">
								.
							</span>
						</h1>

						<p className="max-w-2xl font-medium text-lg dark:text-gray-100 text-gray-700 md:text-xl/relaxed xl:text-2xl/relaxed">
							Upload Images. Ask Questions. Get Insights.
						</p>

						<p className="max-w-2xl font-normal text-sm dark:text-gray-300 text-gray-500 md:text-base/relaxed">
							Transform your visual content into intelligent
							conversations with AI-powered analysis
						</p>
					</header>

					<div>
						<SignedIn>
							<button
								onClick={() => (window.location.href = '/chat')}
								className="inline-flex items-center justify-center px-12 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
							>
								<MessageSquare className="w-5 h-5 mr-2" />
								Start Chatting
							</button>
						</SignedIn>

						<SignedOut>
							<SignInButton
								mode="modal"
								fallbackRedirectUrl={'/chat'}
								forceRedirectUrl={'/chat'}
							>
								<button className="inline-flex items-center justify-center px-12 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer">
									<Upload className="w-5 h-5 mr-2" />
									Get Started
								</button>
							</SignInButton>
						</SignedOut>
					</div>

					<div className="w-full max-w-4xl">
						<div className="bg-white/60 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-gray-300 dark:border-slate-700 shadow-lg overflow-hidden">
							<div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-300 dark:divide-slate-700">
								<div className="p-8 text-center hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors duration-300">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl mb-4">
										<Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
									</div>

									<h3 className="text-xl font-semibold text-black dark:text-gray-100 mb-3">
										Simple Upload
									</h3>

									<p className="text-sm dark:text-gray-300 text-gray-600 leading-relaxed">
										Drag, drop, or click to upload any image
										format instantly
									</p>
								</div>

								<div className="p-8 text-center hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors duration-300">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl mb-4">
										<MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
									</div>

									<h3 className="text-xl font-semibold text-black dark:text-gray-100 mb-3">
										Natural Chat
									</h3>

									<p className="text-sm dark:text-gray-300 text-gray-600 leading-relaxed">
										Ask questions about your images in plain
										English
									</p>
								</div>

								<div className="p-8 text-center hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors duration-300">
									<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl mb-4">
										<Eye className="w-8 h-8 text-blue-600 dark:text-blue-400" />
									</div>

									<h3 className="text-xl font-semibold text-black dark:text-gray-100 mb-3">
										Smart Analysis
									</h3>

									<p className="text-sm dark:text-gray-300 text-gray-600 leading-relaxed">
										Get detailed insights powered by
										advanced AI
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="w-full max-w-5xl">
						<h2 className="text-2xl font-bold text-black dark:text-white mb-8">
							Trusted By Many Users
						</h2>

						<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
							<div className="bg-white/70 dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-300 dark:border-slate-700 text-center">
								<div className="flex items-center justify-center mb-3">
									<TrendingUp className="w-8 h-8 text-green-500" />
								</div>

								<div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
									95%
								</div>

								<div className="text-sm font-medium dark:text-gray-300 text-gray-600">
									Accuracy Rate
								</div>
							</div>

							<div className="bg-white/70 dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-300 dark:border-slate-700 text-center">
								<div className="flex items-center justify-center mb-3">
									<Zap className="w-8 h-8 text-yellow-500" />
								</div>

								<div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
									&lt;5s
								</div>

								<div className="text-sm font-medium dark:text-gray-300 text-gray-600">
									Analysis Speed
								</div>
							</div>

							<div className="bg-white/70 dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-300 dark:border-slate-700 text-center">
								<div className="flex items-center justify-center mb-3">
									<Shield className="w-8 h-8 text-indigo-500" />
								</div>

								<div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
									50+
								</div>

								<div className="text-sm font-medium dark:text-gray-300 text-gray-600">
									File Formats
								</div>
							</div>

							<div className="bg-white/70 dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-300 dark:border-slate-700 text-center">
								<div className="flex items-center justify-center mb-3">
									<Users className="w-8 h-8 text-purple-500" />
								</div>

								<div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
									24/7
								</div>

								<div className="text-sm font-medium dark:text-gray-300 text-gray-600">
									Available
								</div>
							</div>
						</div>
					</div>

					<div className="pt-4">
						<p className="text-xs dark:text-gray-400 text-gray-500 font-medium tracking-wide">
							Powered by Advanced AI • Simple • Fast • Accurate
						</p>
					</div>
				</section>
			</main>
		</>
	);
}
