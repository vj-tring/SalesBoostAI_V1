interface MetricsData {
  activeConversations: number;
  totalConversations: number;
  conversionRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
}

interface MetricsCardsProps {
  metrics?: MetricsData;
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return (rate * 100).toFixed(1) + '%';
  };

  const cards = [
    {
      title: "Active Conversations",
      value: metrics?.activeConversations ?? 0,
      icon: "fas fa-comments",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      trend: "+12%",
      trendText: "from last hour",
    },
    {
      title: "Conversion Rate",
      value: metrics ? formatPercentage(metrics.conversionRate) : "0%",
      icon: "fas fa-chart-line",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      trend: "+5.2%",
      trendText: "from yesterday",
    },
    {
      title: "Revenue Generated",
      value: metrics ? formatCurrency(metrics.totalRevenue) : "$0",
      icon: "fas fa-dollar-sign",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      trend: "+18.3%",
      trendText: "from last week",
    },
    {
      title: "Total Orders",
      value: metrics?.totalOrders ?? 0,
      icon: "fas fa-shopping-cart",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      trend: "+7.8%",
      trendText: "this month",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">{card.title}</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{card.value}</p>
            </div>
            <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
              <i className={`${card.icon} ${card.iconColor} text-xl`}></i>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">{card.trend}</span>
            <span className="text-neutral-600 ml-2">{card.trendText}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
