'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Eye,
  FileEdit,
  Image as ImageIcon,
  Loader2,
  LogOut,
  MapPin,
  Search,
  ShieldCheck,
  XCircle,
  Clock,
  Info,
  Landmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { HERITAGE_SITES, HeritageSite, VerificationStatus } from '@/lib/heritage-data';
import { SafeImage } from '@/components/ui/safe-image';

type FilterTab = 'All' | 'Pending Verification' | 'LGU Verified' | 'Needs Revision' | 'Rejected';

const CITIES = ['Cebu City', 'Mandaue City', 'Talisay City', 'Lapu-Lapu City'];

function normalizeLguSite(site: any, dbOverride?: any): HeritageSite & { _source: string } {
  const merged = { ...(site || {}), ...(dbOverride || {}) };
  const rawCoords = merged.coordinates || { lat: merged.latitude, lng: merged.longitude };
  const latitude = Number(rawCoords?.lat);
  const longitude = Number(rawCoords?.lng);

  return {
    ...merged,
    id: merged.id,
    name: merged.name || 'Untitled Heritage Site',
    description: merged.description || 'No directory description available.',
    overview: merged.overview || merged.description || 'No detailed overview provided.',
    significance: merged.significance || 'Historical significance details not specified.',
    category: merged.category || 'Historical Landmarks & Monuments',
    location: merged.location || 'Location address unspecified',
    city: merged.city || 'Cebu City',
    visitingHours: merged.visitingHours || 'Visiting hours unspecified',
    imageUrl: merged.imageUrl || '',
    galleryImages: Array.isArray(merged.galleryImages) ? merged.galleryImages : [],
    rating: Number.isFinite(Number(merged.rating)) ? Number(merged.rating) : 4.5,
    tags: Array.isArray(merged.tags) ? merged.tags : [],
    coordinates: {
      lat: Number.isFinite(latitude) ? latitude : 0,
      lng: Number.isFinite(longitude) ? longitude : 0,
    },
    isMustVisit: Boolean(merged.isMustVisit),
    needsVerification: Boolean(merged.needsVerification),
    // CRITICAL: Default strictly to 'Pending Verification' if not set in Firestore
    verificationStatus: (merged.verificationStatus as VerificationStatus) || 'Pending Verification',
    verifiedBy: merged.verifiedBy || undefined,
    verifiedByUid: merged.verifiedByUid || undefined,
    verifiedAt: merged.verifiedAt || undefined,
    verificationNotes: merged.verificationNotes || undefined,
    isActive: merged.isActive !== false,
    status: merged.status === 'Inactive' ? 'Inactive' : 'Active',
    demolitionStatus: merged.demolitionStatus || 'Non-Demolished',
    accessibilityStatus: merged.accessibilityStatus || 'Accessibility details unspecified.',
    _source: dbOverride ? 'Firestore Override' : 'Built-in Static Record',
  };
}

export default function LguDashboardPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [isInspectDialogOpen, setIsInspectDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [targetAction, setTargetAction] = useState<'Needs Revision' | 'Rejected' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Authenticated LGU role verification
  const lguDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: isCheckingRole } = useDoc(lguDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/lgu-login');
      return;
    }
    if (!isUserLoading && !isCheckingRole && user) {
      if (!userData || userData.role !== 'lgu') {
        toast({ title: 'Unauthorized', description: 'LGU Officer access is required.', variant: 'destructive' });
        router.push('/explore');
      }
    }
  }, [user, isUserLoading, userData, isCheckingRole, router, toast]);

  // Hybrid Data Integration: Query Firestore heritageSites collection
  const sitesQuery = useMemoFirebase(() => db ? collection(db, 'heritageSites') : null, [db]);
  const { data: dbSites, isLoading: isSitesLoading } = useCollection(sitesQuery);

  // Combine static HERITAGE_SITES + live Firestore overrides
  const combinedSites = useMemo(() => {
    const siteMap = new Map<string, any>();

    // Step 1: Add all static built-in sites first
    HERITAGE_SITES.forEach(site => {
      siteMap.set(site.id, site);
    });

    // Step 2: Overlay live Firestore documents (overrides or custom additions)
    (dbSites || []).forEach((dbSite: any) => {
      if (!dbSite?.id) return;
      const staticSite = siteMap.get(dbSite.id);
      siteMap.set(dbSite.id, normalizeLguSite(staticSite || dbSite, dbSite));
    });

    // Normalize any static sites that were not in dbSites
    const result: Array<HeritageSite & { _source: string }> = [];
    siteMap.forEach((val, key) => {
      if (!val._source) {
        result.push(normalizeLguSite(val));
      } else {
        result.push(val);
      }
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [dbSites]);

  // Filtered sites based on tab, city, search
  const filteredSites = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return combinedSites.filter(site => {
      const matchesSearch = !q || [site.name, site.city, site.category, site.location, site.description]
        .join(' ')
        .toLowerCase()
        .includes(q);
      const matchesCity = cityFilter === 'All' || site.city === cityFilter;
      const matchesTab = activeTab === 'All' || site.verificationStatus === activeTab;

      return matchesSearch && matchesCity && matchesTab;
    });
  }, [combinedSites, searchQuery, cityFilter, activeTab]);

  // Statistics counters
  const stats = useMemo(() => {
    return {
      total: combinedSites.length,
      pending: combinedSites.filter(s => s.verificationStatus === 'Pending Verification').length,
      verified: combinedSites.filter(s => s.verificationStatus === 'LGU Verified').length,
      revision: combinedSites.filter(s => s.verificationStatus === 'Needs Revision').length,
      rejected: combinedSites.filter(s => s.verificationStatus === 'Rejected').length,
    };
  }, [combinedSites]);

  if (isUserLoading || isCheckingRole || !userData || userData.role !== 'lgu') {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/lgu-login');
  };

  const handleOpenInspect = (site: any) => {
    setSelectedSite(site);
    setIsInspectDialogOpen(true);
  };

  // Perform sparse Firestore write for verification action
  const executeVerificationAction = async (
    site: any,
    newStatus: VerificationStatus,
    notes: string = ''
  ) => {
    if (!db || !user) return;

    setIsUpdatingStatus(true);
    try {
      const siteRef = doc(db, 'heritageSites', site.id);
      const reviewerName = user.displayName || user.email?.split('@')[0] || 'LGU Representative';

      const updatePayload: Record<string, any> = {
        verificationStatus: newStatus,
        verifiedBy: reviewerName,
        verifiedByUid: user.uid,
        verifiedAt: new Date().toISOString(),
        verificationNotes: notes.trim(),
      };

      await setDoc(siteRef, updatePayload, { merge: true });

      toast({
        title: `Site ${newStatus}`,
        description: `${site.name} status updated to ${newStatus}.`,
      });

      setIsNotesDialogOpen(false);
      setIsInspectDialogOpen(false);
      setSelectedSite(null);
      setActionNotes('');
    } catch (error) {
      console.error('Failed to update verification status:', error);
      toast({
        title: 'Update Failed',
        description: 'Check your connection and Firestore security rules.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleQuickVerify = (site: any) => {
    executeVerificationAction(site, 'LGU Verified');
  };

  const handleOpenNotesDialog = (action: 'Needs Revision' | 'Rejected') => {
    setTargetAction(action);
    setActionNotes('');
    setIsNotesDialogOpen(true);
  };

  const handleConfirmNotesAction = () => {
    if (!selectedSite || !targetAction) return;
    executeVerificationAction(selectedSite, targetAction, actionNotes);
  };

  const getStatusBadge = (status?: VerificationStatus) => {
    switch (status) {
      case 'LGU Verified':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-none flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider shadow-sm">
            <CheckCircle2 size={12} /> LGU Verified
          </Badge>
        );
      case 'Needs Revision':
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider shadow-sm">
            <FileEdit size={12} /> Needs Revision
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge className="bg-red-600 hover:bg-red-700 text-white border-none flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider shadow-sm">
            <XCircle size={12} /> Rejected
          </Badge>
        );
      case 'Pending Verification':
      default:
        return (
          <Badge variant="outline" className="border-amber-400 text-amber-800 bg-amber-50 flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider shadow-sm">
            <Clock size={12} /> Pending Verification
          </Badge>
        );
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50 font-body">
      <Navbar />

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white p-5 md:flex md:flex-col justify-between">
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 text-emerald-600">
                <ShieldCheck size={22} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Official LGU Portal</p>
              </div>
              <h2 className="mt-2 text-lg font-black text-slate-950">Site Verification</h2>
              <p className="mt-1 text-xs text-slate-500">
                Review and validate Metro Cebu cultural heritage site information.
              </p>
            </div>

            <div className="space-y-1 mb-6">
              {(['All', 'Pending Verification', 'LGU Verified', 'Needs Revision', 'Rejected'] as FilterTab[]).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex h-10 w-full items-center justify-between rounded-md px-3 text-left text-xs font-bold transition-colors',
                    activeTab === tab
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  )}
                >
                  <span>{tab}</span>
                  <Badge variant="secondary" className={cn('text-[9px]', activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700')}>
                    {tab === 'All' && stats.total}
                    {tab === 'Pending Verification' && stats.pending}
                    {tab === 'LGU Verified' && stats.verified}
                    {tab === 'Needs Revision' && stats.revision}
                    {tab === 'Rejected' && stats.rejected}
                  </Badge>
                </button>
              ))}
            </div>

            {/* Status Explanation Legend */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-[11px] text-slate-600 space-y-2">
              <p className="font-black text-slate-700 uppercase tracking-widest text-[9px]">Verification Guide</p>
              <div className="flex items-start gap-2">
                <span className="shrink-0 text-emerald-600 font-bold">🟢</span>
                <span><strong className="text-slate-900 font-bold">LGU Verified</strong> — Reviewed & approved by LGU.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 text-amber-500 font-bold">🟡</span>
                <span><strong className="text-slate-900 font-bold">Pending</strong> — Awaiting LGU review.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 text-orange-500 font-bold">🟠</span>
                <span><strong className="text-slate-900 font-bold">Needs Revision</strong> — Corrections required before approval.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 text-red-600 font-bold">🔴</span>
                <span><strong className="text-slate-900 font-bold">Rejected</strong> — Not approved for public listing.</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex h-10 items-center gap-3 rounded-md px-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={17} />
            Logout Portal
          </button>
        </aside>

        {/* Main Workspace */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1500px] p-4 md:p-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Verification Console</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  {activeTab === 'All' ? 'All Heritage Site Records' : activeTab}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Verify authentic landmarks to display the public "LGU Verified" seal, or flag records that require revision.
                </p>
              </div>
            </div>

            {/* Mobile Tab Pills */}
            <div className="mb-5 overflow-x-auto pb-1 md:hidden">
              <div className="flex w-max gap-2">
                {(['All', 'Pending Verification', 'LGU Verified', 'Needs Revision', 'Rejected'] as FilterTab[]).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex h-9 items-center gap-2 rounded-md px-3 text-xs font-bold',
                      activeTab === tab ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Overview */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Card className="rounded-lg border-slate-200 bg-white">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Database size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Directory</p>
                    <p className="text-2xl font-black text-slate-950">{stats.total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-lg border-slate-200 bg-white">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Review</p>
                    <p className="text-2xl font-black text-slate-950">{stats.pending}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-lg border-slate-200 bg-white">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">LGU Verified</p>
                    <p className="text-2xl font-black text-slate-950">{stats.verified}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-lg border-slate-200 bg-white">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                    <FileEdit size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Needs Revision</p>
                    <p className="text-2xl font-black text-slate-950">{stats.revision}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Table */}
            <Card className="rounded-lg border-slate-200 bg-white">
              <CardHeader className="gap-4 border-b border-slate-100 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle className="text-base font-black">Heritage Landmarks Directory</CardTitle>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <div className="relative min-w-[240px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search landmark, location..."
                        className="h-10 rounded-md border-slate-200 pl-9"
                      />
                    </div>
                    <select
                      value={cityFilter}
                      onChange={e => setCityFilter(e.target.value)}
                      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium"
                    >
                      <option value="All">All Cities</option>
                      {CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="min-w-[280px]">Landmark Name</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead className="min-w-[220px]">Category</TableHead>
                        <TableHead>Verification Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isSitesLoading && combinedSites.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-40 text-center">
                            <Loader2 className="mx-auto animate-spin text-emerald-600" />
                          </TableCell>
                        </TableRow>
                      )}

                      {!isSitesLoading && filteredSites.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-40 text-center">
                            <p className="font-bold text-slate-700">No site records found.</p>
                            <p className="mt-1 text-sm text-slate-500">Try selecting another status tab or clearing filters.</p>
                          </TableCell>
                        </TableRow>
                      )}

                      {!isSitesLoading && filteredSites.map(site => (
                        <TableRow key={site.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                                {site.imageUrl ? (
                                  <SafeImage src={site.imageUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <ImageIcon size={18} className="text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-black text-slate-950">{site.name}</p>
                                <p className="truncate text-xs text-slate-500">{site.location}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm font-semibold">{site.city}</TableCell>
                          <TableCell className="text-sm text-slate-600">{site.category}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getStatusBadge(site.verificationStatus)}
                              {site.verifiedBy && (
                                <p className="text-[10px] text-slate-400 font-medium">
                                  By {site.verifiedBy}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-md font-bold text-xs"
                                onClick={() => handleOpenInspect(site)}
                              >
                                <Eye size={14} className="mr-1" /> Inspect
                              </Button>
                              {site.verificationStatus !== 'LGU Verified' && (
                                <Button
                                  size="sm"
                                  className="h-8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                                  onClick={() => handleQuickVerify(site)}
                                  disabled={isUpdatingStatus}
                                >
                                  <CheckCircle2 size={14} className="mr-1" /> Verify
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Inspect & Review Dialog */}
      <Dialog open={isInspectDialogOpen} onOpenChange={setIsInspectDialogOpen}>
        <DialogContent className="max-h-[92dvh] w-[96vw] max-w-4xl overflow-y-auto rounded-lg bg-white p-0">
          {selectedSite && (
            <>
              <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-2xl font-black text-slate-950">
                    {selectedSite.name}
                  </DialogTitle>
                  {getStatusBadge(selectedSite.verificationStatus)}
                </div>
                <DialogDescription className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <MapPin size={12} /> {selectedSite.location}, {selectedSite.city}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 px-6 py-5">
                {/* Photo Banner */}
                <div className="relative h-64 w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                  {selectedSite.imageUrl ? (
                    <SafeImage src={selectedSite.imageUrl} alt={selectedSite.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <ImageIcon size={36} />
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                        <Landmark size={14} /> Category
                      </h4>
                      <p className="text-sm font-bold text-slate-800">{selectedSite.category}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                        <Clock size={14} /> Visiting Hours
                      </h4>
                      <p className="text-sm font-bold text-slate-800">{selectedSite.visitingHours}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                        <Info size={14} /> Accessibility
                      </h4>
                      <p className="text-sm font-bold text-slate-800">{selectedSite.accessibilityStatus}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Overview</h4>
                      <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">{selectedSite.overview}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Historical Significance</h4>
                      <p className="text-xs italic leading-relaxed text-slate-600 whitespace-pre-wrap">{selectedSite.significance}</p>
                    </div>
                  </div>
                </div>

                {/* Existing Verification Metadata if present */}
                {selectedSite.verifiedBy && (
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                    <p className="text-xs font-bold text-slate-700">Previous Review Information:</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Reviewed by: <span className="font-semibold text-slate-900">{selectedSite.verifiedBy}</span> on{' '}
                      {selectedSite.verifiedAt ? new Date(selectedSite.verifiedAt).toLocaleDateString() : 'N/A'}
                    </p>
                    {selectedSite.verificationNotes && (
                      <p className="text-xs text-amber-700 mt-2 font-medium bg-amber-50 p-2 rounded border border-amber-200">
                        Notes: "{selectedSite.verificationNotes}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={() => setIsInspectDialogOpen(false)} disabled={isUpdatingStatus}>
                  Close Inspection
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-amber-300 text-amber-800 hover:bg-amber-50 font-bold"
                    onClick={() => handleOpenNotesDialog('Needs Revision')}
                    disabled={isUpdatingStatus}
                  >
                    <FileEdit size={16} className="mr-1.5" /> Request Revision
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50 font-bold"
                    onClick={() => handleOpenNotesDialog('Rejected')}
                    disabled={isUpdatingStatus}
                  >
                    <XCircle size={16} className="mr-1.5" /> Reject
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    onClick={() => executeVerificationAction(selectedSite, 'LGU Verified')}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? <Loader2 size={16} className="mr-1.5 animate-spin" /> : <CheckCircle2 size={16} className="mr-1.5" />}
                    Mark LGU Verified
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Revision / Rejection Notes Input Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="max-w-md rounded-lg bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-950">
              {targetAction === 'Needs Revision' ? 'Specify Revision Requirements' : 'Specify Rejection Reason'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Provide detailed feedback for the site administrator regarding what information needs correction.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-2">
            <Label htmlFor="verification-notes" className="text-xs font-bold text-slate-700">
              Reviewer Notes
            </Label>
            <Textarea
              id="verification-notes"
              value={actionNotes}
              onChange={e => setActionNotes(e.target.value)}
              placeholder={
                targetAction === 'Needs Revision'
                  ? 'Example: Visiting hours require verification against official city museum records.'
                  : 'Example: Landmark details contain inaccurate historical dates.'
              }
              className="min-h-[110px] text-xs"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)} disabled={isUpdatingStatus}>
              Cancel
            </Button>
            <Button
              className={targetAction === 'Rejected' ? 'bg-red-600 hover:bg-red-700 text-white font-bold' : 'bg-amber-600 hover:bg-amber-700 text-white font-bold'}
              onClick={handleConfirmNotesAction}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? <Loader2 size={16} className="mr-1.5 animate-spin" /> : null}
              Confirm {targetAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
