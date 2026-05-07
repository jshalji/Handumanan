'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  LayoutDashboard, 
  MapPin, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  Database,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type AdminTab = 'dashboard' | 'sites' | 'categories' | 'feedback' | 'users' | 'settings';

export default function AdminDashboardPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isSiteDialogOpen, setIsSiteDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);

  // Auth Guard
  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: isCheckingRole } = useDoc(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/admin-login');
    if (!isCheckingRole && userData && userData.role !== 'admin') {
      toast({ title: "Unauthorized", variant: "destructive" });
      router.push('/explore');
    }
  }, [user, isUserLoading, userData, isCheckingRole, router, toast]);

  // Data Fetching
  const sitesQuery = useMemoFirebase(() => db ? query(collection(db, 'heritageSites'), orderBy('name')) : null, [db]);
  const { data: sites, isLoading: isSitesLoading } = useCollection(sitesQuery);

  if (isUserLoading || isCheckingRole || !userData || userData.role !== 'admin') {
    return <div className="h-screen flex items-center justify-center bg-slate-900"><Loader2 className="animate-spin text-white" size={48} /></div>;
  }

  const handleLogout = () => {
    signOut(auth);
    router.push('/admin-login');
  };

  const handleSaveSite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const siteData = {
      name: formData.get('name') as string,
      city: formData.get('city') as string,
      category: formData.get('category') as string,
      location: formData.get('location') as string,
      visitingHours: formData.get('visitingHours') as string,
      imageUrl: formData.get('imageUrl') as string,
      description: formData.get('description') as string,
      significance: formData.get('significance') as string,
      // CRITICAL: Ensure coordinates are saved as NUMBERS
      latitude: Number(formData.get('latitude')),
      longitude: Number(formData.get('longitude')),
      rating: parseFloat(formData.get('rating') as string) || 4.5,
      updatedAt: serverTimestamp(),
      createdAt: editingSite ? editingSite.createdAt : serverTimestamp()
    };

    const siteRef = editingSite ? doc(db, 'heritageSites', editingSite.id) : doc(collection(db, 'heritageSites'));
    setDocumentNonBlocking(siteRef, siteData, { merge: true });
    
    toast({ title: editingSite ? "Site Updated" : "Site Created", description: siteData.name });
    setIsSiteDialogOpen(false);
    setEditingSite(null);
  };

  const SidebarItem = ({ id, label, icon: Icon }: { id: AdminTab; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
        activeTab === id 
          ? "bg-primary text-white shadow-lg shadow-primary/20" 
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
      )}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-950 font-body overflow-hidden">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-64 bg-slate-900 border-r border-white/5 flex flex-col p-6 shrink-0 hidden md:flex">
          <div className="mb-10">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Management</h2>
            <nav className="space-y-2">
              <SidebarItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
              <SidebarItem id="sites" label="Heritage Sites" icon={MapPin} />
              <SidebarItem id="categories" label="Categories" icon={Database} />
              <SidebarItem id="feedback" label="User Feedback" icon={MessageSquare} />
              <SidebarItem id="users" label="System Users" icon={Users} />
              <SidebarItem id="settings" label="Settings" icon={Settings} />
            </nav>
          </div>
          <div className="mt-auto pt-6 border-t border-white/5">
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 font-bold text-sm w-full">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto bg-slate-950 text-white p-4 md:p-10">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Administrator Access</p>
              <h1 className="text-4xl font-headline font-black capitalize tracking-tight">{activeTab}</h1>
            </div>
            {activeTab === 'sites' && (
              <Button onClick={() => { setEditingSite(null); setIsSiteDialogOpen(true); }} className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-6 font-black uppercase text-xs tracking-widest">
                <Plus size={18} className="mr-2" /> Add Heritage Site
              </Button>
            )}
          </header>

          {/* TAB CONTENT: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Sites', value: sites?.length || 0, icon: MapPin, color: 'text-blue-400' },
                    { label: 'Active Users', value: 124, icon: Users, color: 'text-green-400' },
                    { label: 'Feedback', value: 42, icon: MessageSquare, color: 'text-purple-400' },
                    { label: 'Uptime', value: '99.9%', icon: Globe, color: 'text-orange-400' },
                  ].map((stat, i) => (
                    <Card key={i} className="bg-slate-900 border-white/5 p-6 rounded-3xl shadow-2xl">
                       <div className="flex justify-between items-start mb-4">
                          <div className={cn("p-3 rounded-2xl bg-white/5", stat.color)}><stat.icon size={24} /></div>
                          <ChevronRight className="text-slate-700" size={16} />
                       </div>
                       <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{stat.label}</p>
                       <p className="text-3xl font-black mt-1">{stat.value}</p>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {/* TAB CONTENT: SITES */}
          {activeTab === 'sites' && (
            <div className="animate-in fade-in duration-500">
               <Card className="bg-slate-900 border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div className="relative flex-1 md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <Input placeholder="Search heritage database..." className="pl-10 bg-white/5 border-none h-11 rounded-xl text-sm" />
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-slate-500 uppercase text-[10px] font-black">Heritage Site</TableHead>
                          <TableHead className="text-slate-500 uppercase text-[10px] font-black">Category</TableHead>
                          <TableHead className="text-slate-500 uppercase text-[10px] font-black">Location</TableHead>
                          <TableHead className="text-slate-500 uppercase text-[10px] font-black text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isSitesLoading ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                        ) : sites?.map(site => (
                          <TableRow key={site.id} className="border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell>
                               <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-lg overflow-hidden bg-slate-800"><img src={site.imageUrl} className="h-full w-full object-cover" /></div>
                                  <span className="font-bold text-sm">{site.name}</span>
                               </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-400">{site.category}</TableCell>
                            <TableCell className="text-xs text-slate-400">{site.city}</TableCell>
                            <TableCell className="text-right">
                               <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-400 hover:bg-blue-400/10" onClick={() => { setEditingSite(site); setIsSiteDialogOpen(true); }}>
                                     <Edit2 size={14} />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:bg-red-400/10" onClick={() => { if(confirm('Delete site?')) deleteDocumentNonBlocking(doc(db, 'heritageSites', site.id)); }}>
                                     <Trash2 size={14} />
                                  </Button>
                               </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
               </Card>
            </div>
          )}
        </main>
      </div>

      {/* SITE EDIT/ADD DIALOG */}
      <Dialog open={isSiteDialogOpen} onOpenChange={setIsSiteDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10 text-white rounded-[2.5rem] p-10">
          <DialogHeader>
            <DialogTitle className="text-3xl font-headline font-black">{editingSite ? 'Edit' : 'Register'} Heritage Site</DialogTitle>
            <DialogDescription className="text-slate-500">Provide precise historical and geographic data.</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveSite} className="space-y-8 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Official Name</Label>
                <Input name="name" defaultValue={editingSite?.name} required className="bg-white/5 border-none h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Latitude (Exact)</Label>
                <Input name="latitude" type="number" step="any" defaultValue={editingSite?.latitude} required className="bg-white/5 border-none h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Longitude (Exact)</Label>
                <Input name="longitude" type="number" step="any" defaultValue={editingSite?.longitude} required className="bg-white/5 border-none h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Jurisdiction (City)</Label>
                <Input name="city" defaultValue={editingSite?.city} required className="bg-white/5 border-none h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Category</Label>
                <Input name="category" defaultValue={editingSite?.category} required className="bg-white/5 border-none h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Image Asset URL</Label>
                <Input name="imageUrl" defaultValue={editingSite?.imageUrl} required className="bg-white/5 border-none h-12 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Public Description</Label>
              <Textarea name="description" defaultValue={editingSite?.description} required className="bg-white/5 border-none min-h-[100px] rounded-xl" />
            </div>

            <DialogFooter className="pt-6 border-t border-white/5">
              <Button type="button" variant="ghost" onClick={() => setIsSiteDialogOpen(false)} className="h-14 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400">Cancel</Button>
              <Button type="submit" className="bg-primary h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30">Commit Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
