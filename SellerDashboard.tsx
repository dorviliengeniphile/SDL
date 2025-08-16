import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, MessageSquare, Euro, CreditCard } from 'lucide-react';
import { AddProductDialog } from './AddProductDialog';
import { SellerSubscriptionCard } from './SellerSubscriptionCard';

interface Product {
  id: string;
  title: string;
  price: number;
  status: string;
  stock_quantity: number;
  created_at: string;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  products?: { title: string };
}

export function SellerDashboard() {
  const { profile, updateProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    pendingOrders: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.is_seller) {
      fetchSellerData();
    }
  }, [profile]);

  const fetchSellerData = async () => {
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', profile?.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          products:product_id (title)
        `)
        .eq('seller_id', profile?.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setProducts(productsData || []);
      // Simplify orders data to avoid type issues
      const simplifiedOrders = (ordersData || []).map(order => ({
        id: order.id,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        products: Array.isArray(order.products) ? order.products[0] : order.products
      }));
      setOrders(simplifiedOrders);

      // Calculate stats
      const totalProducts = productsData?.length || 0;
      const paidOrders = ordersData?.filter(order => order.status === 'paid') || [];
      const totalSales = paidOrders.length;
      const pendingOrders = ordersData?.filter(order => order.status === 'pending').length || 0;
      const revenue = paidOrders.reduce((sum, order) => sum + order.total_amount, 0);

      setStats({ totalProducts, totalSales, pendingOrders, revenue });
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const becomeSeller = async () => {
    try {
      await updateProfile({ is_seller: true });
    } catch (error) {
      console.error('Error becoming seller:', error);
    }
  };

  if (!profile?.is_seller) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Devenir vendeur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Commencez à vendre vos produits sur notre marketplace. 
              Créez votre espace vendeur et atteignez des milliers de clients.
            </p>
            <Button onClick={becomeSeller} className="w-full">
              Créer mon espace vendeur
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tableau de bord vendeur</h1>
        <AddProductDialog onProductAdded={fetchSellerData}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un produit
          </Button>
        </AddProductDialog>
      </div>

      {/* Subscription Status */}
      <SellerSubscriptionCard />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.revenue.toFixed(2)}€</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Products */}
      <Card>
        <CardHeader>
          <CardTitle>Mes produits récents</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun produit ajouté. Commencez par ajouter votre premier produit !
            </p>
          ) : (
            <div className="space-y-4">
              {products.slice(0, 5).map((product) => (
                <div key={product.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{product.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Stock: {product.stock_quantity} • {product.price}€
                    </p>
                  </div>
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                    {product.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}