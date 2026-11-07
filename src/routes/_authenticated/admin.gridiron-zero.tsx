import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { AccessDenied } from '@/components/access-denied';

export const Route = createFileRoute('/_authenticated/admin/gridiron-zero')({
  head: () => ({ meta: [{ title: 'Gridiron Zero Story Bible — Admin' }, { name: 'robots', content: 'noindex, nofollow, noarchive' }] }),
  component: GridironLibrary,
});

function GridironLibrary() {
  const [html, setHtml] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'denied' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setHtml('');
    setStatus('loading');
    const subscription = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { active = false; controller.abort(); setHtml(''); }
    }).data.subscription;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) { window.location.assign('/login?next=%2Fadmin%2Fgridiron-zero'); return; }
        const response = await fetch('/api/admin/gridiron-zero/library', {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          cache: 'no-store', signal: controller.signal,
        });
        if (!active) return;
        if (response.status === 403) { setStatus('denied'); return; }
        if (response.status === 401) { window.location.assign('/login?next=%2Fadmin%2Fgridiron-zero'); return; }
        if (!response.ok) throw new Error('Library unavailable');
        const document = await response.text();
        if (!active) return;
        // Isolate browser notes between admin accounts on shared computers.
        const scoped = document.replace("const storageKey='gridiron-zero-review-v1';", `const storageKey=${JSON.stringify('gridiron-zero-review-v1:' + data.session.user.id)};`);
        const hosted = scoped.replace(
          "if(location.hash!==hash)history.pushState(null,'',hash)",
          "if(window.parent.location.hash!==hash)window.parent.history.pushState(window.parent.history.state,'',hash)",
        );
        setHtml(hosted);
        setStatus('ready');
      } catch {
        if (active) setStatus('error');
      }
    })();
    return () => { active = false; controller.abort(); subscription.unsubscribe(); };
  }, [retry]);

  if (status === 'denied') return <AccessDenied area="The Gridiron Zero Story Bible" />;
  return (
    <main className="flex h-[100dvh] min-h-[400px] flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div><h1 className="font-bold">Gridiron Zero <span className="text-sm font-normal text-muted-foreground">· Private production library</span></h1>
          <p className="text-xs text-muted-foreground">Review notes save to this browser. Use Export to back them up.</p></div>
        <Link to="/admin/gridiron-comics" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">Comic library →</Link>
        <Link to="/admin" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">← Admin dashboard</Link>
      </header>
      {status === 'loading' && <p role="status" className="p-8 text-center text-muted-foreground">Verifying admin access and loading the illustrated Bible…</p>}
      {status === 'error' && <div role="alert" className="p-8 text-center"><p>The library could not be loaded. Your notes have not been changed.</p><button className="mt-4 rounded-md border px-4 py-2" onClick={() => setRetry(n => n + 1)}>Try again</button></div>}
      {status === 'ready' && <iframe title="Gridiron Zero interactive Story Bible" srcDoc={html} className="min-h-0 w-full flex-1 border-0" allow="clipboard-write" />}
    </main>
  );
}
