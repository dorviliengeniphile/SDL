import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CreditCard, AlertCircle } from 'lucide-react';

export function SellerSubscriptionCard() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-seller-subscription');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de l'abonnement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seller-portal');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'accès au portail",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile?.seller_subscription_active) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Abonnement vendeur requis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pour commencer à vendre sur notre plateforme, vous devez souscrire à un abonnement vendeur.
          </p>
          <div className="bg-background p-4 rounded-lg border">
            <h4 className="font-medium mb-2">Abonnement Vendeur - 9,99€/mois</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ajout illimité de produits</li>
              <li>• Gestion des commandes</li>
              <li>• Messagerie avec les acheteurs</li>
              <li>• Tableaux de bord détaillés</li>
              <li>• Support prioritaire</li>
            </ul>
          </div>
          <Button onClick={handleSubscribe} disabled={loading} className="w-full">
            {loading ? 'Chargement...' : 'S\'abonner maintenant - 9,99€/mois'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const subscriptionEnd = profile.seller_subscription_end ? new Date(profile.seller_subscription_end) : null;
  const isExpiringSoon = subscriptionEnd && subscriptionEnd.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <Card className={isExpiringSoon ? "border-warning/50 bg-warning/5" : "border-success/50 bg-success/5"}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Abonnement vendeur
          </span>
          <Badge variant={isExpiringSoon ? "destructive" : "default"}>
            {profile.seller_subscription_active ? 'Actif' : 'Inactif'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptionEnd && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Renouvellement le {subscriptionEnd.toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}
        
        {isExpiringSoon && (
          <div className="bg-warning/10 p-3 rounded-lg text-sm">
            <p className="text-warning-foreground">
              Votre abonnement expire bientôt. Assurez-vous que votre moyen de paiement est à jour.
            </p>
          </div>
        )}
        
        <Button variant="outline" onClick={handleManageSubscription} disabled={loading} className="w-full">
          {loading ? 'Chargement...' : 'Gérer mon abonnement'}
        </Button>
      </CardContent>
    </Card>
  );
}