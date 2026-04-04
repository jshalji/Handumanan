
'use client';

import { Navbar } from '@/components/layout/Navbar';
import { HERITAGE_SITES } from '@/lib/heritage-data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, Search, Database, Users, Eye } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-headline text-4xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage Metro Cebu's cultural heritage site directory.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 rounded-full px-6">
            <Plus size={18} className="mr-2" /> Add New Site
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <Database size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Sites</p>
                <p className="text-3xl font-bold">{HERITAGE_SITES.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">User Reviews</p>
                <p className="text-3xl font-bold">142</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                <Eye size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Views</p>
                <p className="text-3xl font-bold">4.8k</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Table */}
        <Card className="overflow-hidden border-none shadow-xl">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between p-6">
            <CardTitle className="font-headline">Heritage Sites Directory</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input placeholder="Search sites..." className="pl-9 h-9 text-sm" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-[300px]">Site Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {HERITAGE_SITES.map((site) => (
                  <TableRow key={site.id} className="hover:bg-slate-50">
                    <TableCell className="font-bold">{site.name}</TableCell>
                    <TableCell>{site.category}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{site.location}</TableCell>
                    <TableCell>{site.city}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
