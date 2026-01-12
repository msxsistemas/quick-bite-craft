import { AdminLayout } from '@/components/admin/AdminLayout';
import { Store, DollarSign, TrendingUp, Users } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const ResellerReportsPage = () => {
  const stats = [
    { 
      label: 'Total de Restaurantes', 
      value: '4', 
      icon: Store, 
      color: 'bg-primary/10 text-primary' 
    },
    { 
      label: 'Receita Mensal', 
      value: 'R$ 149.90', 
      icon: DollarSign, 
      color: 'bg-green-100 text-green-600' 
    },
    { 
      label: 'Taxa de Conversão', 
      value: '25%', 
      subtext: 'Trial → Ativo',
      icon: TrendingUp, 
      color: 'bg-primary/10 text-primary' 
    },
    { 
      label: 'Restaurantes Ativos', 
      value: '1', 
      icon: Users, 
      color: 'bg-green-100 text-green-600' 
    },
  ];

  const pieData = [
    { name: 'Ativos', value: 1, color: '#22c55e' },
    { name: 'Em Teste', value: 3, color: '#3b82f6' },
  ];

  const barData = [
    { name: 'Burger House Gourmet', value: 149.90 },
  ];

  const bottomStats = [
    { 
      label: 'Receita Anual Projetada', 
      value: 'R$ 1798.80', 
      subtext: 'Baseado nos restaurantes ativos atuais' 
    },
    { 
      label: 'Ticket Médio', 
      value: 'R$ 149.90', 
      subtext: 'Por restaurante ativo' 
    },
    { 
      label: 'Churn Rate', 
      value: '0.0%', 
      subtext: 'Restaurantes suspensos/cancelados' 
    },
  ];

  return (
    <AdminLayout type="reseller">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise completa dos seus restaurantes</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="delivery-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  {stat.subtext && (
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.subtext}</p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Status Distribution */}
          <div className="delivery-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Distribuição por Status</h2>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={true}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} restaurantes`, '']}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--background))'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart - Revenue by Restaurant */}
          <div className="delivery-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Receita por Restaurante</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={true} />
                  <XAxis 
                    type="number" 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `R$${value}`}
                    domain={[0, 160]}
                    ticks={[0, 40, 80, 120, 160]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, 'Receita']}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--background))'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bottomStats.map((stat) => (
            <div key={stat.label} className="delivery-card p-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ResellerReportsPage;
