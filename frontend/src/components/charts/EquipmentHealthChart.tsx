import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
  { name: 'Healthy', value: 42, color: 'hsl(140 60% 60%)' },
  { name: 'Warning', value: 4, color: 'hsl(45 95% 55%)' },
  { name: 'Critical', value: 2, color: 'hsl(0 70% 55%)' },
];

export function EquipmentHealthChart() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Equipment Health Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                stroke="transparent"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(235 45% 12%)',
                  border: '1px solid hsl(235 30% 18%)',
                  borderRadius: '8px',
                  color: 'hsl(230 30% 92%)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span style={{ color: 'hsl(230 30% 92%)' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
          {data.map((item) => (
            <div key={item.name} className="text-center">
              <p className="text-2xl font-bold" style={{ color: item.color }}>
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground">{item.name}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}