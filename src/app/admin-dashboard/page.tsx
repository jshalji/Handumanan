'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Edit2,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  MessageSquare,
  Plus,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { HERITAGE_SITES } from '@/lib/heritage-data';
import { SafeImage } from '@/components/ui/safe-image';

type AdminTab = 'dashboard' | 'sites' | 'categories' | 'feedback' | 'users' | 'settings';

type SiteFormState = {
  name: string;
  city: string;
  category: string;
  location: string;
  visitingHours: string;
  accessibilityStatus: string;
  imageUrl: string;
  galleryImages: string;
  description: string;
  overview: string;
  significance: string;
  latitude: string;
  longitude: string;
  rating: string;
  tags: string;
  status: 'Active' | 'Inactive';
  demolitionStatus: 'Non-Demolished' | 'Demolished' | 'Partially Demolished';
  isActive: boolean;
  isMustVisit: boolean;
  needsVerification: boolean;
};

const ADMIN_NAV_ITEMS = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sites' as const, label: 'Heritage Sites', icon: MapPin },
  { id: 'categories' as const, label: 'Categories', icon: Database },
  { id: 'feedback' as const, label: 'User Feedback', icon: MessageSquare },
  { id: 'users' as const, label: 'System Users', icon: Users },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
];

const CITIES = ['Cebu City', 'Mandaue City', 'Talisay City', 'Lapu-Lapu City'];

const CATEGORIES = [
  'Churches & Religious Heritage Sites',
  'Ancestral Houses & Heritage Residences',
  'Museums & Cultural Institutions',
  'Historical Landmarks & Monuments',
  'Plazas, Parks & Public Spaces',
  'Government & Historic Buildings',
  'Cultural & Religious (Non-Catholic Sites)',
];

const EMPTY_SITE_FORM: SiteFormState = {
  name: '',
  city: 'Cebu City',
  category: 'Historical Landmarks & Monuments',
  location: '',
  visitingHours: 'Open hours require verification',
  accessibilityStatus: 'Accessible',
  imageUrl: '',
  galleryImages: '',
  description: '',
  overview: '',
  significance: '',
  latitude: '',
  longitude: '',
  rating: '4.5',
  tags: '',
  status: 'Active',
  demolitionStatus: 'Non-Demolished',
  isActive: true,
  isMustVisit: false,
  needsVerification: false,
};

function getSiteCoords(site: any) {
  return site?.coordinates || { lat: site?.latitude, lng: site?.longitude };
}

function normalizeSiteRecord(site: any, existingSite?: any) {
  const coords = getSiteCoords(site);
  const latitude = Number(coords?.lat);
  const longitude = Number(coords?.lng);
  const coordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { lat: latitude, lng: longitude }
    : existingSite?.coordinates;

  return {
    ...(existingSite || {}),
    ...site,
    coordinates,
    tags: Array.isArray(site.tags) ? site.tags : (Array.isArray(existingSite?.tags) ? existingSite.tags : []),
  };
}

function getPersistableSiteData(site: any) {
  const publicSiteData = { ...normalizeSiteRecord(site) };
  delete publicSiteData._recordSource;
  return publicSiteData;
}

function listToText(value: unknown) {
  return Array.isArray(value) ? value.join('\n') : '';
}

function splitList(value: string) {
  return value
    .split(/[\n,]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function getInitialFormState(site?: any): SiteFormState {
  if (!site) return EMPTY_SITE_FORM;

  const coords = getSiteCoords(site);
  return {
    name: site.name || '',
    city: site.city || 'Cebu City',
    category: site.category || 'Historical Landmarks & Monuments',
    location: site.location || '',
    visitingHours: site.visitingHours || 'Open hours require verification',
    accessibilityStatus: site.accessibilityStatus || 'Accessible',
    imageUrl: site.imageUrl || '',
    galleryImages: listToText(site.galleryImages),
    description: site.description || '',
    overview: site.overview || '',
    significance: site.significance || '',
    latitude: coords?.lat !== undefined && coords?.lat !== null ? String(coords.lat) : '',
    longitude: coords?.lng !== undefined && coords?.lng !== null ? String(coords.lng) : '',
    rating: site.rating ? String(site.rating) : '4.5',
    tags: Array.isArray(site.tags) ? site.tags.join(', ') : '',
    status: site.status || (site.isActive === false ? 'Inactive' : 'Active'),
    demolitionStatus: site.demolitionStatus || 'Non-Demolished',
    isActive: site.isActive !== false,
    isMustVisit: Boolean(site.isMustVisit),
    needsVerification: Boolean(site.needsVerification),
  };
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getCompleteness(site: any) {
  const coords = getSiteCoords(site);
  const required = [
    site.name,
    site.city,
    site.category,
    site.location,
    site.visitingHours,
    site.imageUrl,
    site.description,
    site.significance,
    coords?.lat,
    coords?.lng,
  ];
  const filled = required.filter(value => String(value ?? '').trim().length > 0).length;
  return Math.round((filled / required.length) * 100);
}

export default function AdminDashboardPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isSiteDialogOpen, setIsSiteDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);
  const [formState, setFormState] = useState<SiteFormState>(EMPTY_SITE_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSiteId, setDeletingSiteId] = useState<string | null>(null);

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: isCheckingRole } = useDoc(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/admin-login');
      return;
    }
    if (!isUserLoading && !isCheckingRole && user) {
      if (!userData || userData.role !== 'admin') {
        toast({ title: 'Unauthorized', description: 'Administrator access is required.', variant: 'destructive' });
        router.push('/explore');
      }
    }
  }, [user, isUserLoading, userData, isCheckingRole, router, toast]);

  const sitesQuery = useMemoFirebase(() => db ? query(collection(db, 'heritageSites'), orderBy('name')) : null, [db]);
  const { data: dbSites, isLoading: isSitesLoading } = useCollection(sitesQuery);

  const directorySites = useMemo(() => {
    const sitesById = new Map(
      HERITAGE_SITES.map(site => [site.id, { ...site, _recordSource: 'Built-in directory' } as any])
    );

    (dbSites || []).forEach((site: any) => {
      if (!site?.id) return;
      const existingSite = sitesById.get(site.id);
      sitesById.set(site.id, {
        ...normalizeSiteRecord(site, existingSite),
        _recordSource: existingSite ? 'Firestore override' : 'Firestore record',
      });
    });

    return Array.from(sitesById.values()).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [dbSites]);

  const filteredSites = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();
    return directorySites.filter(site => {
      const searchable = [
        site.name,
        site.city,
        site.category,
        site.location,
        site.description,
        ...(site.tags || []),
      ].join(' ').toLowerCase();

      return (
        (!queryText || searchable.includes(queryText)) &&
        (cityFilter === 'All' || site.city === cityFilter) &&
        (categoryFilter === 'All' || site.category === categoryFilter)
      );
    });
  }, [categoryFilter, cityFilter, directorySites, searchQuery]);

  const stats = useMemo(() => {
    const allSites = directorySites;
    return {
      total: allSites.length,
      active: allSites.filter(site => site.isActive !== false && site.status !== 'Inactive').length,
      needsReview: allSites.filter(site => site.needsVerification || getCompleteness(site) < 100).length,
      images: allSites.filter(site => isValidHttpUrl(site.imageUrl || '')).length,
    };
  }, [directorySites]);

  const categoryRows = useMemo(() => {
    return CATEGORIES.map(category => {
      const categorySites = directorySites.filter(site => site.category === category);
      return {
        category,
        count: categorySites.length,
        active: categorySites.filter(site => site.isActive !== false && site.status !== 'Inactive').length,
      };
    });
  }, [directorySites]);

  if (isUserLoading || isCheckingRole || !userData || userData.role !== 'admin') {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const updateForm = (field: keyof SiteFormState, value: string | boolean) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const openCreateDialog = () => {
    setEditingSite(null);
    setFormState(EMPTY_SITE_FORM);
    setIsSiteDialogOpen(true);
  };

  const openEditDialog = (site: any) => {
    setEditingSite(site);
    setFormState(getInitialFormState(site));
    setIsSiteDialogOpen(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin-login');
  };

  const validateSiteForm = () => {
    const requiredFields: Array<[keyof SiteFormState, string]> = [
      ['name', 'Official name'],
      ['city', 'City'],
      ['category', 'Category'],
      ['location', 'Street address or barangay'],
      ['visitingHours', 'Visitor hours'],
      ['imageUrl', 'Main image URL'],
      ['description', 'Directory description'],
      ['significance', 'Historical significance'],
    ];

    for (const [field, label] of requiredFields) {
      if (!String(formState[field]).trim()) {
        return `${label} is required.`;
      }
    }

    if (!isValidHttpUrl(formState.imageUrl.trim())) {
      return 'Main image URL must be a valid http or https URL.';
    }

    const latitude = Number(formState.latitude);
    const longitude = Number(formState.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return 'Latitude must be a valid number between -90 and 90.';
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return 'Longitude must be a valid number between -180 and 180.';
    }

    const rating = Number(formState.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      return 'Rating must be between 0 and 5.';
    }

    return null;
  };

  const handleSaveSite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!db) return;

    const validationError = validateSiteForm();
    if (validationError) {
      toast({ title: 'Check the site record', description: validationError, variant: 'destructive' });
      return;
    }

    const latitude = Number(formState.latitude);
    const longitude = Number(formState.longitude);
    const isActive = formState.status === 'Active' && formState.isActive;
    const siteData = {
      name: formState.name.trim(),
      city: formState.city,
      category: formState.category,
      location: formState.location.trim(),
      visitingHours: formState.visitingHours.trim(),
      accessibilityStatus: formState.accessibilityStatus.trim() || 'Accessible',
      imageUrl: formState.imageUrl.trim(),
      galleryImages: splitList(formState.galleryImages),
      description: formState.description.trim(),
      overview: formState.overview.trim() || formState.description.trim(),
      significance: formState.significance.trim(),
      latitude,
      longitude,
      coordinates: { lat: latitude, lng: longitude },
      rating: Number(formState.rating),
      tags: splitList(formState.tags),
      status: isActive ? 'Active' : 'Inactive',
      isActive,
      isMustVisit: formState.isMustVisit,
      needsVerification: formState.needsVerification,
      demolitionStatus: formState.demolitionStatus,
      updatedAt: serverTimestamp(),
      createdAt: editingSite?.createdAt || serverTimestamp(),
    };

    setIsSaving(true);
    try {
      const siteRef = editingSite ? doc(db, 'heritageSites', editingSite.id) : doc(collection(db, 'heritageSites'));
      await setDoc(siteRef, siteData, { merge: true });
      toast({ title: editingSite ? 'Site updated' : 'Site created', description: siteData.name });
      setIsSiteDialogOpen(false);
      setEditingSite(null);
      setFormState(EMPTY_SITE_FORM);
    } catch (error) {
      console.error('Failed to save heritage site:', error);
      toast({ title: 'Save failed', description: 'Please check your connection and Firestore permissions.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSite = async (site: any) => {
    if (!db) return;

    const isBuiltInSite = site._recordSource === 'Built-in directory' || site._recordSource === 'Firestore override';
    const confirmed = isBuiltInSite
      ? confirm(`Hide ${site.name} from the public app? This creates an inactive Firestore override so the built-in record no longer appears.`)
      : confirm(`Delete ${site.name}? This removes the Firestore record.`);

    if (!confirmed) return;

    setDeletingSiteId(site.id);
    try {
      if (isBuiltInSite) {
        await setDoc(doc(db, 'heritageSites', site.id), {
          ...getPersistableSiteData(site),
          isActive: false,
          status: 'Inactive',
          needsVerification: true,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        toast({ title: 'Site hidden', description: `${site.name} is inactive in the public directory.` });
      } else {
        await deleteDoc(doc(db, 'heritageSites', site.id));
        toast({ title: 'Site deleted', description: site.name });
      }
    } catch (error) {
      console.error('Failed to delete heritage site:', error);
      const isPermissionError = error instanceof Error && /permission|PERMISSION_DENIED/i.test(error.message);
      toast({
        title: 'Delete failed',
        description: isPermissionError
          ? 'Firestore rejected the request. Deploy the updated firestore.rules so profile admins can manage heritage sites.'
          : 'Please check your connection and try again.',
        variant: 'destructive'
      });
    } finally {
      setDeletingSiteId(null);
    }
  };

  const SidebarItem = ({ id, label, icon: Icon }: { id: AdminTab; label: string; icon: any }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={cn(
        'flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition-colors',
        activeTab === id
          ? 'bg-primary text-white'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
      )}
    >
      <Icon size={17} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50 font-body">
      <Navbar />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white p-5 md:flex md:flex-col">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Management</p>
            <h2 className="mt-2 text-lg font-black text-slate-950">Admin Console</h2>
          </div>
          <nav className="space-y-1">
            {ADMIN_NAV_ITEMS.map(item => (
              <SidebarItem key={item.id} {...item} />
            ))}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-auto flex h-10 items-center gap-3 rounded-md px-3 text-sm font-bold text-red-600 hover:bg-red-50"
          >
            <LogOut size={17} />
            Logout
          </button>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1500px] p-4 md:p-8">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Administrator Access</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  {activeTab === 'sites' ? 'Heritage Site Records' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Manage built-in directory data and Firestore overrides used for map pins, directory cards, visitor info, and route planning.
                </p>
              </div>
              {activeTab === 'sites' && (
                <Button onClick={openCreateDialog} className="h-11 rounded-md font-bold">
                  <Plus size={17} className="mr-2" />
                  Add Cebu Landmark
                </Button>
              )}
            </div>

            <div className="mb-5 overflow-x-auto pb-1 md:hidden">
              <div className="flex w-max gap-2">
                {ADMIN_NAV_ITEMS.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'flex h-9 items-center gap-2 rounded-md px-3 text-xs font-bold',
                      activeTab === item.id ? 'bg-primary text-white' : 'bg-white text-slate-600'
                    )}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'dashboard' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {[
                    { label: 'Directory Sites', value: stats.total, icon: Database, color: 'text-blue-600' },
                    { label: 'Active Public', value: stats.active, icon: CheckCircle2, color: 'text-green-600' },
                    { label: 'Needs Review', value: stats.needsReview, icon: AlertCircle, color: 'text-amber-600' },
                    { label: 'Image URLs', value: stats.images, icon: ImageIcon, color: 'text-violet-600' },
                  ].map(stat => (
                    <Card key={stat.label} className="rounded-lg border-slate-200 bg-white">
                      <CardContent className="flex items-center gap-4 p-5">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-md bg-slate-100', stat.color)}>
                          <stat.icon size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                          <p className="text-2xl font-black text-slate-950">{stat.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="rounded-lg border-slate-200 bg-white">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-base font-black">Recent Site Records</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <SiteTable
                      sites={directorySites.slice(0, 6)}
                      isLoading={isSitesLoading && directorySites.length === 0}
                      onEdit={openEditDialog}
                      onDelete={handleDeleteSite}
                      deletingSiteId={deletingSiteId}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'sites' && (
              <Card className="rounded-lg border-slate-200 bg-white">
                <CardHeader className="gap-4 border-b border-slate-100">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <CardTitle className="text-base font-black">Manage Landmark Data</CardTitle>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <div className="relative min-w-[260px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <Input
                          value={searchQuery}
                          onChange={event => setSearchQuery(event.target.value)}
                          placeholder="Search name, location, tags..."
                          className="h-10 rounded-md border-slate-200 pl-9"
                        />
                      </div>
                      <select value={cityFilter} onChange={event => setCityFilter(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium">
                        <option value="All">All Cities</option>
                        {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                      </select>
                      <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium">
                        <option value="All">All Categories</option>
                        {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <SiteTable
                    sites={filteredSites}
                    isLoading={isSitesLoading && directorySites.length === 0}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteSite}
                    deletingSiteId={deletingSiteId}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 'categories' && (
              <Card className="rounded-lg border-slate-200 bg-white">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-base font-black">Directory Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="w-36">Records</TableHead>
                        <TableHead className="w-36">Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryRows.map(row => (
                        <TableRow key={row.category}>
                          <TableCell className="font-semibold">{row.category}</TableCell>
                          <TableCell>{row.count}</TableCell>
                          <TableCell>{row.active}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {(['feedback', 'users', 'settings'] as AdminTab[]).includes(activeTab) && (
              <Card className="rounded-lg border-slate-200 bg-white">
                <CardContent className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
                  <ShieldCheck className="mb-3 text-slate-300" size={42} />
                  <h2 className="text-xl font-black text-slate-950">Panel Reserved</h2>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    This area is ready for the next admin workflow. Heritage site records are fully managed in the current Sites panel.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      <Dialog open={isSiteDialogOpen} onOpenChange={(open) => {
        setIsSiteDialogOpen(open);
        if (!open) {
          setEditingSite(null);
          setFormState(EMPTY_SITE_FORM);
        }
      }}>
        <DialogContent className="max-h-[92dvh] w-[96vw] max-w-5xl overflow-y-auto rounded-lg bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-2xl font-black text-slate-950">
              {editingSite ? 'Edit Heritage Site' : 'Add Cebu Landmark'}
            </DialogTitle>
            <DialogDescription>
              Complete every required field so the record works in the map, directory, chatbot, and route planner.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSite}>
            <div className="grid gap-6 px-6 py-5 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-6">
                <FormSection title="Identity">
                  <FormField label="Official Name" required>
                    <Input value={formState.name} onChange={event => updateForm('name', event.target.value)} placeholder="Example: Cebu Provincial Capitol" />
                  </FormField>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="City" required>
                      <select value={formState.city} onChange={event => updateForm('city', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Category" required>
                      <select value={formState.category} onChange={event => updateForm('category', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </FormField>
                  </div>
                  <FormField label="Street Address or Barangay" required>
                    <Input value={formState.location} onChange={event => updateForm('location', event.target.value)} placeholder="Street, barangay, city" />
                  </FormField>
                </FormSection>

                <FormSection title="Visitor Information">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Visiting Hours" required>
                      <Input value={formState.visitingHours} onChange={event => updateForm('visitingHours', event.target.value)} placeholder="9:00 AM - 5:00 PM" />
                    </FormField>
                    <FormField label="Accessibility">
                      <Input value={formState.accessibilityStatus} onChange={event => updateForm('accessibilityStatus', event.target.value)} placeholder="Fully Accessible" />
                    </FormField>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <ToggleField label="Active in public app" checked={formState.isActive} onChange={value => updateForm('isActive', value)} />
                    <ToggleField label="Must-visit highlight" checked={formState.isMustVisit} onChange={value => updateForm('isMustVisit', value)} />
                    <ToggleField label="Needs verification" checked={formState.needsVerification} onChange={value => updateForm('needsVerification', value)} />
                  </div>
                </FormSection>

                <FormSection title="Descriptions">
                  <FormField label="Directory Description" required>
                    <Textarea value={formState.description} onChange={event => updateForm('description', event.target.value)} className="min-h-[90px]" placeholder="Short card-friendly description." />
                  </FormField>
                  <FormField label="Full Overview">
                    <Textarea value={formState.overview} onChange={event => updateForm('overview', event.target.value)} className="min-h-[120px]" placeholder="Detailed visitor and historical context." />
                  </FormField>
                  <FormField label="Historical Significance" required>
                    <Textarea value={formState.significance} onChange={event => updateForm('significance', event.target.value)} className="min-h-[110px]" placeholder="Why this site matters to Cebu heritage." />
                  </FormField>
                </FormSection>
              </div>

              <div className="space-y-6">
                <FormSection title="Map Coordinates">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                    <FormField label="Latitude" required>
                      <Input value={formState.latitude} onChange={event => updateForm('latitude', event.target.value)} type="number" step="any" placeholder="10.3157" />
                    </FormField>
                    <FormField label="Longitude" required>
                      <Input value={formState.longitude} onChange={event => updateForm('longitude', event.target.value)} type="number" step="any" placeholder="123.8854" />
                    </FormField>
                  </div>
                </FormSection>

                <FormSection title="Images">
                  <FormField label="Main Image URL" required>
                    <Input value={formState.imageUrl} onChange={event => updateForm('imageUrl', event.target.value)} placeholder="https://..." />
                  </FormField>
                  <FormField label="Gallery Image URLs">
                    <Textarea value={formState.galleryImages} onChange={event => updateForm('galleryImages', event.target.value)} className="min-h-[90px]" placeholder="One URL per line" />
                  </FormField>
                </FormSection>

                <FormSection title="Classification">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                    <FormField label="Public Status">
                      <select value={formState.status} onChange={event => updateForm('status', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </FormField>
                    <FormField label="Demolition Status">
                      <select value={formState.demolitionStatus} onChange={event => updateForm('demolitionStatus', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        <option value="Non-Demolished">Non-Demolished</option>
                        <option value="Partially Demolished">Partially Demolished</option>
                        <option value="Demolished">Demolished</option>
                      </select>
                    </FormField>
                    <FormField label="Rating">
                      <Input value={formState.rating} onChange={event => updateForm('rating', event.target.value)} type="number" min="0" max="5" step="0.1" />
                    </FormField>
                    <FormField label="Tags">
                      <Textarea value={formState.tags} onChange={event => updateForm('tags', event.target.value)} className="min-h-[82px]" placeholder="museum, spanish-era, cebu-city" />
                    </FormField>
                  </div>
                </FormSection>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setIsSiteDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                Save Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="border-b border-slate-100 pb-2 text-xs font-black uppercase tracking-widest text-slate-500">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SiteTable({
  sites,
  isLoading,
  onEdit,
  onDelete,
  deletingSiteId,
}: {
  sites: any[];
  isLoading: boolean;
  onEdit: (site: any) => void;
  onDelete: (site: any) => void;
  deletingSiteId: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="min-w-[280px]">Site</TableHead>
            <TableHead>City</TableHead>
            <TableHead className="min-w-[240px]">Category</TableHead>
            <TableHead>Visitor Info</TableHead>
            <TableHead>Health</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center">
                <Loader2 className="mx-auto animate-spin text-primary" />
              </TableCell>
            </TableRow>
          )}

          {!isLoading && sites.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center">
                <p className="font-bold text-slate-700">No site records found.</p>
                <p className="mt-1 text-sm text-slate-500">Add a landmark or clear your filters.</p>
              </TableCell>
            </TableRow>
          )}

          {!isLoading && sites.map(site => {
            const completeness = getCompleteness(site);
            const coords = getSiteCoords(site);
            const latitude = Number(coords?.lat);
            const longitude = Number(coords?.lng);
            const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
            return (
              <TableRow key={site.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                      {site.imageUrl ? (
                        <SafeImage src={site.imageUrl} alt="" className="h-full w-full object-cover" fallbackClassName="object-contain bg-primary/5 p-3" />
                      ) : (
                        <ImageIcon size={18} className="text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{site.name || 'Untitled Site'}</p>
                      <p className="truncate text-xs text-slate-500">{site.location || 'No address yet'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm font-semibold">{site.city || 'Unassigned'}</TableCell>
                <TableCell className="text-sm text-slate-600">{site.category || 'Uncategorized'}</TableCell>
                <TableCell>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>{site.visitingHours || 'Hours missing'}</p>
                    <p>{hasCoordinates ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'Coordinates missing'}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={site.isActive === false || site.status === 'Inactive' ? 'secondary' : 'default'} className={site.isActive === false || site.status === 'Inactive' ? '' : 'bg-green-600'}>
                      {site.isActive === false || site.status === 'Inactive' ? 'Inactive' : 'Active'}
                    </Badge>
                    <Badge variant="outline">{site._recordSource || 'Firestore record'}</Badge>
                    <Badge variant={completeness === 100 ? 'outline' : 'destructive'}>
                      {completeness}% complete
                    </Badge>
                    {site.needsVerification && <Badge variant="secondary">Review</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onEdit(site)} aria-label={`Edit ${site.name}`}>
                      <Edit2 size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => onDelete(site)}
                      disabled={deletingSiteId === site.id}
                      aria-label={`Delete ${site.name}`}
                    >
                      {deletingSiteId === site.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
