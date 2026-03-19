import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const CA_PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
  "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
  "Quebec", "Saskatchewan", "Yukon"
];

const COMMODITIES = [
  "Corn", "Soybeans", "Wheat", "Cotton", "Rice", "Barley", "Sorghum", "Oats",
  "Sunflower", "Canola", "Peanuts", "Potatoes", "Tomatoes", "Lettuce", "Onions",
  "Carrots", "Beans", "Peas", "Alfalfa", "Clover", "Grass", "Pasture", "Range",
  "Forest", "Ornamental", "Turf"
];

interface AgrianProductLookupProps {
  open: boolean;
  onClose: () => void;
  onSelectProduct: (product: any) => void;
  defaultCountry?: "United States" | "Canada";
  defaultState?: string;
  defaultCommodity?: string;
}

export function AgrianProductLookup({
  open,
  onClose,
  onSelectProduct,
  defaultCountry = "United States",
  defaultState,
  defaultCommodity,
}: AgrianProductLookupProps) {
  console.log('[AgrianProductLookup] RENDER START - open:', open);
  const [country, setCountry] = useState<"United States" | "Canada">(defaultCountry);
  const [state, setState] = useState(defaultState || "");
  const [commodity, setCommodity] = useState(defaultCommodity || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  console.log('[AgrianProductLookup] Component rendered, open:', open, 'state:', state, 'commodity:', commodity);

  // Search products
  const searchProducts = trpc.agrian.searchProducts.useQuery(
    {
      country,
      state,
      commodity,
      productName: searchQuery,
    },
    {
      enabled: false, // Manual trigger
    }
  );

  // Get product details
  const productDetails = trpc.agrian.getProductDetail.useQuery(
    {
      url: selectedProduct?.detailUrl || "",
      state,
      commodity,
    },
    {
      enabled: !!selectedProduct?.detailUrl,
    }
  );

  const handleSearch = () => {
    if (!state && !commodity && !searchQuery) {
      toast.error("Please provide at least one search criteria");
      return;
    }
    searchProducts.refetch();
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
  };

  const handleUseProduct = () => {
    if (selectedProduct && productDetails.data) {
      onSelectProduct({
        ...selectedProduct,
        ...productDetails.data,
      });
      onClose();
      toast.success("Product data populated successfully");
    }
  };

  const states = country === "United States" ? US_STATES : CA_PROVINCES;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">EPA Product Lookup - Agrian Label Center</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Search for EPA-registered agricultural products and auto-populate compliance data
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>Country</Label>
              <Select value={country} onValueChange={(v: any) => setCountry(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>State/Province</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state..." />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Commodity/Crop</Label>
              <Select value={commodity} onValueChange={setCommodity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select commodity..." />
                </SelectTrigger>
                <SelectContent>
                  {COMMODITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Product Name</Label>
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={searchProducts.isLoading} className="mb-6">
            {searchProducts.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Search className="mr-2 h-4 w-4" />
            Search Products
          </Button>

          {/* Results */}
          {searchProducts.data && searchProducts.data.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                Search Results ({searchProducts.data.length} products found)
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Registration #</TableHead>
                      <TableHead>Registrant</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchProducts.data.map((product: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.registrationNumber || "N/A"}</TableCell>
                        <TableCell>{product.registrant || "N/A"}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectProduct(product)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Product Details */}
          {selectedProduct && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedProduct.name}</h3>
                <Button onClick={handleUseProduct} disabled={productDetails.isLoading}>
                  Use This Product
                </Button>
              </div>

              {productDetails.isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading product details...</span>
                </div>
              )}

              {productDetails.data && (
                <Tabs defaultValue="general">
                  <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="crop">Crop Specific</TabsTrigger>
                    <TabsTrigger value="safety">Safety/PPE</TabsTrigger>
                    <TabsTrigger value="registration">Registration</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Registrant</Label>
                        <p>{productDetails.data.registrant || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Label Version</Label>
                        <p>{productDetails.data.labelVersion || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Formulation Type</Label>
                        <p>{productDetails.data.formulationType || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Physical State</Label>
                        <p>{productDetails.data.physicalState || "N/A"}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">Active Ingredients</Label>
                        <p>{productDetails.data.activeIngredients || "N/A"}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="crop" className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Re-Entry Interval</Label>
                        <p>{productDetails.data.reEntryInterval || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Preharvest Interval</Label>
                        <p>{productDetails.data.preharvestInterval || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Max Applications/Season</Label>
                        <p>{productDetails.data.maxApplicationsPerSeason || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Max Rate/Season</Label>
                        <p>{productDetails.data.maxRatePerSeason || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Methods Allowed</Label>
                        <p>{productDetails.data.methodsAllowed || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Rate</Label>
                        <p>{productDetails.data.rate || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Diluent (Aerial)</Label>
                        <p>{productDetails.data.diluentAerial || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Diluent (Ground)</Label>
                        <p>{productDetails.data.diluentGround || "N/A"}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="safety" className="space-y-3">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label className="text-muted-foreground">PPE Information</Label>
                        <p>{productDetails.data.ppeInformation || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Re-Entry PPE</Label>
                        <p>{productDetails.data.reEntryPPE || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">SDS Hazard Signal Word</Label>
                        <p>{productDetails.data.sdsHazardSignalWord || "N/A"}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="registration" className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">EPA Registration Number</Label>
                        <p className="font-mono">{productDetails.data.epaRegistrationNumber || "N/A"}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">Approved States</Label>
                        <p>{productDetails.data.approvedStates || "N/A"}</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}

          {searchProducts.isError && (
            <div className="text-center py-8 text-destructive">
              Error loading products. Please try again.
            </div>
          )}

          {searchProducts.data && searchProducts.data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products found. Try adjusting your search criteria.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
