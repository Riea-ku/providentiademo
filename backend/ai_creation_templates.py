"""
AI Entity Creation Knowledge Base
Defines templates and intelligent question flows for all entities
"""

AI_CREATION_TEMPLATES = {
    'farms': {
        'crop': {
            'questions': [
                {'field': 'name', 'question': 'What would you like to name this farm?', 'type': 'text'},
                {'field': 'farm_type', 'question': 'What type of farm is this?', 'type': 'choice', 'options': ['crop', 'livestock', 'mixed']},
                {'field': 'acreage', 'question': 'How many acres is the farm?', 'type': 'number'},
                {'field': 'location', 'question': 'Where is the farm located? (City, State)', 'type': 'text'},
                {'field': 'primary_crops', 'question': 'What are the primary crops? (comma-separated)', 'type': 'list'},
                {'field': 'irrigation_type', 'question': 'What type of irrigation system?', 'type': 'choice', 'options': ['drip', 'sprinkler', 'center_pivot', 'flood', 'none']},
                {'field': 'soil_quality', 'question': 'Soil quality rating?', 'type': 'choice', 'options': ['excellent', 'good', 'fair', 'poor']}
            ],
            'suggestions': {
                'irrigation_type': 'Based on your acreage, drip irrigation is most efficient',
                'soil_quality': 'Regular soil testing is recommended for optimal crop yield'
            }
        },
        'livestock': {
            'questions': [
                {'field': 'name', 'question': 'What would you like to name this farm?', 'type': 'text'},
                {'field': 'farm_type', 'question': 'What type of farm is this?', 'type': 'choice', 'options': ['crop', 'livestock', 'mixed']},
                {'field': 'acreage', 'question': 'How many acres is the farm?', 'type': 'number'},
                {'field': 'location', 'question': 'Where is the farm located?', 'type': 'text'},
                {'field': 'livestock_types', 'question': 'What types of livestock? (comma-separated)', 'type': 'list'},
                {'field': 'head_count', 'question': 'Total number of animals?', 'type': 'number'},
                {'field': 'facilities', 'question': 'What facilities are available? (barn, pens, etc)', 'type': 'list'}
            ]
        },
        'mixed': {
            'questions': [
                {'field': 'name', 'question': 'What would you like to name this farm?', 'type': 'text'},
                {'field': 'farm_type', 'question': 'What type of farm is this?', 'type': 'choice', 'options': ['crop', 'livestock', 'mixed']},
                {'field': 'acreage', 'question': 'How many acres is the farm?', 'type': 'number'},
                {'field': 'location', 'question': 'Where is the farm located?', 'type': 'text'},
                {'field': 'crop_ratio', 'question': 'What percentage is dedicated to crops?', 'type': 'number'},
                {'field': 'primary_crops', 'question': 'Primary crops?', 'type': 'list'},
                {'field': 'livestock_types', 'question': 'Types of livestock?', 'type': 'list'}
            ]
        }
    },
    'equipment': {
        'tractor': {
            'questions': [
                {'field': 'name', 'question': 'What is the equipment name?', 'type': 'text'},
                {'field': 'equipment_type', 'question': 'What type of equipment?', 'type': 'choice', 'options': ['tractor', 'solar_pump', 'irrigation_system', 'harvester', 'other']},
                {'field': 'brand', 'question': 'What brand/manufacturer?', 'type': 'text'},
                {'field': 'model', 'question': 'Model number?', 'type': 'text'},
                {'field': 'horsepower', 'question': 'Horsepower rating?', 'type': 'number'},
                {'field': 'year', 'question': 'Year of manufacture?', 'type': 'number'},
                {'field': 'operating_hours', 'question': 'Current operating hours?', 'type': 'number'},
                {'field': 'farm_id', 'question': 'Which farm is this equipment for?', 'type': 'reference', 'reference_type': 'farms'}
            ]
        },
        'solar_pump': {
            'questions': [
                {'field': 'name', 'question': 'What is the equipment name?', 'type': 'text'},
                {'field': 'equipment_type', 'question': 'What type of equipment?', 'type': 'choice', 'options': ['tractor', 'solar_pump', 'irrigation_system', 'harvester', 'other']},
                {'field': 'brand', 'question': 'Brand/manufacturer?', 'type': 'text'},
                {'field': 'capacity', 'question': 'Pump capacity (GPM)?', 'type': 'number'},
                {'field': 'wattage', 'question': 'Solar panel wattage?', 'type': 'number'},
                {'field': 'installation_date', 'question': 'When was it installed?', 'type': 'date'},
                {'field': 'farm_id', 'question': 'Which farm?', 'type': 'reference', 'reference_type': 'farms'}
            ],
            'suggestions': {
                'capacity': 'For 10+ acres, minimum 50 GPM recommended',
                'wattage': 'Ensure solar capacity matches pump requirements'
            }
        },
        'irrigation_system': {
            'questions': [
                {'field': 'name', 'question': 'Equipment name?', 'type': 'text'},
                {'field': 'equipment_type', 'question': 'Type?', 'type': 'choice', 'options': ['tractor', 'solar_pump', 'irrigation_system', 'harvester', 'other']},
                {'field': 'irrigation_type', 'question': 'Irrigation system type?', 'type': 'choice', 'options': ['drip', 'sprinkler', 'center_pivot', 'flood']},
                {'field': 'coverage_acres', 'question': 'Coverage area (acres)?', 'type': 'number'},
                {'field': 'pressure_rating', 'question': 'Pressure rating (PSI)?', 'type': 'number'},
                {'field': 'automation_level', 'question': 'Automation level?', 'type': 'choice', 'options': ['manual', 'semi_automated', 'fully_automated']},
                {'field': 'farm_id', 'question': 'Which farm?', 'type': 'reference', 'reference_type': 'farms'}
            ]
        }
    },
    'work_orders': {
        'emergency': {
            'questions': [
                {'field': 'title', 'question': 'Describe the issue briefly', 'type': 'text'},
                {'field': 'equipment_id', 'question': 'Which equipment has the issue?', 'type': 'reference', 'reference_type': 'equipment'},
                {'field': 'priority', 'question': 'Priority level?', 'type': 'choice', 'options': ['critical', 'high', 'medium', 'low']},
                {'field': 'description', 'question': 'Detailed description of the problem', 'type': 'text'},
                {'field': 'immediate_action', 'question': 'Any immediate action taken?', 'type': 'text'},
                {'field': 'parts_needed', 'question': 'Parts needed? (comma-separated)', 'type': 'list'}
            ],
            'ai_analysis': True,
            'auto_assign': True
        },
        'preventive': {
            'questions': [
                {'field': 'title', 'question': 'What maintenance needs to be done?', 'type': 'text'},
                {'field': 'equipment_id', 'question': 'Which equipment?', 'type': 'reference', 'reference_type': 'equipment'},
                {'field': 'maintenance_type', 'question': 'Maintenance type?', 'type': 'choice', 'options': ['routine_inspection', 'oil_change', 'filter_replacement', 'calibration', 'cleaning', 'other']},
                {'field': 'scheduled_date', 'question': 'When should this be done?', 'type': 'date'},
                {'field': 'frequency', 'question': 'Recurrence?', 'type': 'choice', 'options': ['once', 'weekly', 'monthly', 'quarterly', 'yearly']}
            ]
        },
        'predictive': {
            'questions': [
                {'field': 'prediction_id', 'question': 'Based on which prediction?', 'type': 'reference', 'reference_type': 'predictions'},
                {'field': 'title', 'question': 'Work order title?', 'type': 'text'},
                {'field': 'recommended_actions', 'question': 'Recommended actions? (comma-separated)', 'type': 'list'},
                {'field': 'estimated_downtime', 'question': 'Estimated downtime (hours)?', 'type': 'number'}
            ],
            'ai_suggestions': True
        }
    },
    'inventory': {
        'parts': {
            'questions': [
                {'field': 'name', 'question': 'Part name?', 'type': 'text'},
                {'field': 'part_number', 'question': 'Part number/SKU?', 'type': 'text'},
                {'field': 'category', 'question': 'Category?', 'type': 'choice', 'options': ['engine', 'electrical', 'hydraulic', 'filters', 'belts', 'other']},
                {'field': 'compatible_equipment', 'question': 'Compatible with which equipment types?', 'type': 'list'},
                {'field': 'unit_cost', 'question': 'Unit cost ($)?', 'type': 'number'},
                {'field': 'quantity_on_hand', 'question': 'Current quantity?', 'type': 'number'},
                {'field': 'reorder_point', 'question': 'Reorder at what quantity?', 'type': 'number'},
                {'field': 'preferred_supplier', 'question': 'Preferred supplier?', 'type': 'text'}
            ],
            'suggestions': {
                'reorder_point': 'Recommended: 25% of typical monthly usage'
            }
        },
        'tools': {
            'questions': [
                {'field': 'name', 'question': 'Tool name?', 'type': 'text'},
                {'field': 'tool_type', 'question': 'Tool type?', 'type': 'choice', 'options': ['power_tool', 'hand_tool', 'diagnostic', 'safety', 'other']},
                {'field': 'condition', 'question': 'Current condition?', 'type': 'choice', 'options': ['new', 'good', 'fair', 'needs_repair']},
                {'field': 'location', 'question': 'Storage location?', 'type': 'text'},
                {'field': 'last_maintenance', 'question': 'Last maintenance date?', 'type': 'date'}
            ]
        },
        'consumables': {
            'questions': [
                {'field': 'name', 'question': 'Item name?', 'type': 'text'},
                {'field': 'type', 'question': 'Type?', 'type': 'choice', 'options': ['oil', 'fuel', 'chemicals', 'seeds', 'fertilizer', 'other']},
                {'field': 'unit_of_measure', 'question': 'Unit of measure?', 'type': 'choice', 'options': ['gallons', 'liters', 'pounds', 'kilograms', 'bags', 'cases']},
                {'field': 'usage_rate', 'question': 'Typical usage per month?', 'type': 'number'},
                {'field': 'quantity_on_hand', 'question': 'Current quantity?', 'type': 'number'},
                {'field': 'reorder_point', 'question': 'Reorder point?', 'type': 'number'},
                {'field': 'supplier', 'question': 'Supplier name?', 'type': 'text'}
            ]
        }
    }
}

# Validation rules
VALIDATION_RULES = {
    'number': {'min': 0, 'max': 1000000},
    'text': {'min_length': 1, 'max_length': 200},
    'list': {'separator': ',', 'min_items': 1},
    'date': {'format': 'YYYY-MM-DD'}
}

# AI suggestions based on context
CONTEXT_SUGGESTIONS = {
    'farm_size_to_equipment': {
        'small': ['compact_tractor', 'small_pump'],
        'medium': ['utility_tractor', 'medium_pump', 'sprayer'],
        'large': ['heavy_tractor', 'large_pump', 'harvester', 'planter']
    },
    'equipment_to_maintenance': {
        'tractor': ['oil_change', 'filter_replacement', 'hydraulic_check'],
        'solar_pump': ['panel_cleaning', 'bearing_inspection', 'electrical_check'],
        'irrigation_system': ['filter_cleaning', 'pressure_check', 'timer_calibration']
    }
}
