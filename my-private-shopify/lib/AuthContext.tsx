
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import getSupabaseClient from './supabaseClient';

interface UserProfile {
	id: string;
	email: string;
	full_name?: string;
	role: 'super_admin' | 'store_admin' | 'user';
}

interface AuthContextType {
	session: Session | null;
	user: UserProfile | null;
	loading: boolean;
	signUp: (email: string, password: string, fullName?: string) => Promise<{ user?: any; error?: any }>;
	signIn: (email: string, password: string) => Promise<{ error?: any }>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [user, setUser] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	// Always use a fresh client instance per render
	const supabase = getSupabaseClient();

	useEffect(() => {
		// Check initial session
		const checkSession = async () => {
			try {
				const { data: { session } } = await supabase.auth.getSession();
				setSession(session);
				if (session?.user) {
					await fetchUserProfile(session.user.id);
				}
			} catch (err) {
				console.error('Error checking session:', err);
			} finally {
				setLoading(false);
			}
		};

		checkSession();

		// Listen for auth changes
		const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
			setSession(newSession);
			if (newSession?.user) {
				await fetchUserProfile(newSession.user.id);
			} else {
				setUser(null);
			}
		});
		return () => subscription?.unsubscribe();
	}, []);

	const fetchUserProfile = async (userId: string) => {
		try {
			const { data, error } = await supabase
				.from('user_profiles')
				.select('*')
				.eq('id', userId)
				.single();
			if (error) throw error;
			setUser(data as UserProfile);
		} catch (err) {
			console.error('Error fetching user profile:', err);
		}
	};

	const signUp = async (email: string, password: string, fullName?: string) => {
		try {
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, fullName }),
			});
			const data = await response.json();
			if (!response.ok) return { error: data.error || 'Signup failed' };
			return { user: data.user };
		} catch (err: any) {
			return { error: err.message || 'Signup failed' };
		}
	};

	const signIn = async (email: string, password: string) => {
		try {
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) throw error;
			return {};
		} catch (err: any) {
			return { error: err.message || 'Login failed' };
		}
	};

	const signOut = async () => {
		try {
			await supabase.auth.signOut();
			setSession(null);
			setUser(null);
		} catch (err) {
			console.error('Error signing out:', err);
		}
	};

	return (
		<AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within AuthProvider');
	}
	return context;
}
