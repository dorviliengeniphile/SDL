import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SellerDashboard } from "@/components/seller/SellerDashboard";

const SellerPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SellerDashboard />
      <Footer />
    </div>
  );
};

export default SellerPage;