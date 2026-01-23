import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { EquipmentType, EQUIPMENT_CONFIG } from '@/types/equipment';

interface EquipmentSelectorProps {
  selected: EquipmentType;
  onSelect: (type: EquipmentType) => void;
}

export function EquipmentSelector({ selected, onSelect }: EquipmentSelectorProps) {
  const equipmentTypes = Object.entries(EQUIPMENT_CONFIG) as [EquipmentType, typeof EQUIPMENT_CONFIG[EquipmentType]][];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {equipmentTypes.map(([type, config]) => (
        <Card
          key={type}
          className={cn(
            "relative cursor-pointer p-4 transition-all duration-200",
            "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
            selected === type 
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
              : "border-border/50 bg-secondary/30"
          )}
          onClick={() => onSelect(type)}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center text-2xl",
              selected === type ? "bg-primary/20" : "bg-secondary"
            )}>
              {config.icon}
            </div>
            <div>
              <h3 className="font-semibold">{config.name}</h3>
              <p className="text-xs text-muted-foreground">
                {config.sensors.length} sensors
              </p>
            </div>
          </div>
          
          {selected === type && (
            <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary animate-pulse" />
          )}
        </Card>
      ))}
    </div>
  );
}