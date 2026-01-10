import { useParams } from 'react-router-dom';
import { AdminLogin } from '@/components/auth/AdminLogin';

const RestaurantAdminLogin = () => {
  const { slug } = useParams<{ slug: string }>();
  
  return <AdminLogin type="restaurant" restaurantSlug={slug} />;
};

export default RestaurantAdminLogin;
