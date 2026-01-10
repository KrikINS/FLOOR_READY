
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const DebugConnection: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [envCheck, setEnvCheck] = useState<any>({});

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    useEffect(() => {
        // CheckEnv
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        setEnvCheck({
            urlLength: url ? url.length : 0,
            urlStart: url ? url.substring(0, 15) + '...' : 'MISSING',
            keyLength: key ? key.length : 0,
            keyStart: key ? key.substring(0, 10) + '...' : 'MISSING',
            keyEnd: key ? '...' + key.substring(key.length - 10) : 'MISSING'
        });
    }, []);

    const testAuth = async () => {
        addLog('Testing Auth Connection...');
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            addLog('✅ Auth Connection Successful');
            addLog(`Session Status: ${data.session ? 'Active' : 'No Session'}`);
        } catch (err: any) {
            addLog(`❌ Auth Error: ${err.message}`);
        }
    };

    const testFetch = async () => {
        addLog('Testing Raw Fetch...');
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        try {
            const res = await fetch(`${url}/rest/v1/profiles?select=*&limit=1`, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`
                }
            });

            addLog(`✅ Raw Fetch Status: ${res.status} ${res.statusText}`);
            if (res.ok) {
                const json = await res.json();
                addLog(`✅ Data received: ${JSON.stringify(json).slice(0, 50)}...`);
            } else {
                const text = await res.text();
                addLog(`❌ Fetch Body: ${text}`);
            }
        } catch (err: any) {
            addLog(`❌ Fetch Network Error: ${err.message}`);
        }
        const testUserStatus = async () => {
            addLog('Analyzing User & Profile Status...');
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                addLog('❌ No Active Session found.');
                return;
            }

            const user = session.user;
            addLog(`👤 User ID: ${user.id}`);
            addLog(`🔑 Auth Metadata Status: ${user.user_metadata?.status || 'Undefined'}`);
            addLog(`📧 Email: ${user.email}`);

            // Check DB Profile
            try {
                const { data, error: dbError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (dbError) {
                    addLog(`⚠️ DB Profile Error: ${dbError.message} (Code: ${dbError.code})`);
                    if (dbError.code === 'PGRST116') {
                        addLog('❌ Conclusion: Profile Row does NOT exist. The Trigger failed.');
                        addLog('👉 Action: You will need to manually INSERT the row via SQL.');
                    }
                } else {
                    addLog(`✅ DB Profile Found!`);
                    addLog(`📄 DB Role: ${data.role}`);
                    addLog(`📄 DB Status: ${data.status}`);
                    if (data.status !== user.user_metadata?.status) {
                        addLog('⚠️ Mismatch! App needs a hard refresh to sync.');
                    }
                }
            } catch (err: any) {
                addLog(`❌ Err: ${err.message}`);
            }
        };

        const testDB = async () => {
            addLog('Testing DB Connection (Profiles)...');
            try {
                // Using count to minimize data transfer and permission issues
                const { count, error } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                if (error) throw error;
                addLog(`✅ DB Connection Successful. Row count: ${count}`);
            } catch (err: any) {
                addLog(`❌ DB Error: ${err.message}`);
                addLog(`Details: ${JSON.stringify(err)}`);
            }
        };

        return (
            <div className="p-8 max-w-2xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-900 font-mono text-sm">
                <h1 className="text-xl font-bold">Connectivity Debugger</h1>

                <div className="bg-white p-4 rounded shadow space-y-2">
                    <h2 className="font-bold border-b pb-2">Environment Config</h2>
                    <div>URL: {envCheck.urlStart} (Len: {envCheck.urlLength})</div>
                    <a href="/team" className="block text-blue-600 underline">Back to Team Page</a>
                </div>
                );
    };

                export default DebugConnection;
