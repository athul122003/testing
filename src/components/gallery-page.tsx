"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function GalleryPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState("all")

  const years = ["2024", "2023", "2022", "2021"]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gallery</h1>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter by year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Gallery Image</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-title">Title</Label>
                  <Input id="image-title" placeholder="Enter image title" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload Image</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-500">Click to upload image</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsAddOpen(false)}>Add Image</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Empty state */}
        <Card className="col-span-full">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No images in gallery yet. Add your first image!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
