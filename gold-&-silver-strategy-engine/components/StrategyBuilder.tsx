
import React from 'react';
import { Strategy, Condition, LogicGroup, StrategyNode, IndicatorType, Comparator } from '../types';
import { Trash2, Plus, Zap, FolderTree, Hash, Activity, ArrowRight } from 'lucide-react';

interface Props {
  strategy: Strategy;
  setStrategy: React.Dispatch<React.SetStateAction<Strategy>>;
}

// Helper to deep update the tree
const updateNode = (
  root: LogicGroup, 
  targetId: string, 
  transform: (node: StrategyNode) => StrategyNode | null // null to delete
): LogicGroup => {
  if (root.id === targetId) {
     const res = transform(root);
     return res as LogicGroup; 
  }
  
  const newChildren = root.children
    .map(child => {
       if (child.id === targetId) {
           return transform(child);
       }
       if (child.type === 'GROUP') {
           return updateNode(child, targetId, transform);
       }
       return child;
    })
    .filter(Boolean) as StrategyNode[];
    
  return { ...root, children: newChildren };
}

type UpdateTreeFn = (root: 'ENTRY' | 'EXIT', targetId: string, transform: (n: StrategyNode) => StrategyNode | null) => void;
type AddFn = (root: 'ENTRY' | 'EXIT', groupId: string) => void;

interface LogicNodeProps {
  node: StrategyNode;
  rootType: 'ENTRY' | 'EXIT';
  depth: number;
  updateTree: UpdateTreeFn;
  addCondition: AddFn;
  addGroup: AddFn;
}

const LogicNodeBuilder: React.FC<LogicNodeProps> = ({ node, rootType, depth, updateTree, addCondition, addGroup }) => {
    
    // --- Render Condition ---
    if (node.type === 'CONDITION') {
      const condition = node as Condition;
      const isStaticValue = condition.value !== undefined;
      
      const updateCond = (field: keyof Condition | 'left' | 'right', value: any) => {
        updateTree(rootType, condition.id, (n) => {
          const c = n as Condition;
          if (field === 'left' || field === 'right') return { ...c, [field]: { ...c[field], ...value } };
          return { ...c, [field]: value };
        });
      };

      // Handler for Right Side Logic Source Switch (Static vs Indicator)
      const handleRightSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVal = e.target.value;
        if (newVal === 'STATIC_VALUE') {
            // Switch to Static Value mode
            updateTree(rootType, condition.id, (n) => {
                const c = n as Condition;
                return { ...c, value: 0 }; // Initialize with 0 or keep existing if appropriate logic added
            });
        } else {
            // Switch to Indicator mode
            updateTree(rootType, condition.id, (n) => {
                const c = n as Condition;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { value, ...rest } = c; // Remove 'value' key
                return { 
                    ...rest, 
                    right: { type: newVal as IndicatorType, period: 14 } 
                };
            });
        }
      };

      const hasPeriod = (type: IndicatorType) => {
          const STATIC_TYPES = [
            'PRICE','OPEN','HIGH','LOW','VOLUME','PREV_HIGH','PREV_LOW','USDINR',
            'CPR_PIVOT', 'CPR_TC', 'CPR_BC'
          ];
          return !STATIC_TYPES.includes(type);
      };

      return (
        <div className="flex items-center flex-wrap gap-2 p-3 bg-slate-900 border border-slate-700 rounded-lg mb-2 group shadow-sm transition-all hover:border-slate-600">
           
           {/* Left Indicator */}
           <div className="flex gap-2 items-center bg-slate-800 rounded px-2 py-1.5 border border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Left</span>
              <select 
                value={condition.left.type}
                onChange={(e) => updateCond('left', { type: e.target.value })}
                className="bg-transparent text-xs text-slate-200 outline-none font-medium cursor-pointer"
              >
                {Object.values(IndicatorType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {hasPeriod(condition.left.type) && (
                <div className="flex items-center border-l border-slate-600 pl-2">
                    <span className="text-[10px] text-slate-500 mr-1">Len</span>
                    <input type="number" value={condition.left.period} onChange={(e) => updateCond('left', { period: parseInt(e.target.value) })} className="bg-transparent text-xs w-8 text-center text-slate-300 outline-none hover:text-white appearance-none" />
                </div>
              )}
           </div>

           {/* Comparator */}
           <select 
              value={condition.comparator}
              onChange={(e) => updateCond('comparator', e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs rounded px-2 py-1.5 text-blue-400 font-bold cursor-pointer"
            >
              {Object.values(Comparator).map(c => <option key={c} value={c}>{c}</option>)}
           </select>

           {/* Right Side (Unified Control) */}
           <div className={`flex gap-2 items-center rounded px-2 py-1.5 border transition-colors ${isStaticValue ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-800 border-slate-700'}`}>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Right</span>
              
              {/* Unified Source Dropdown */}
              <select 
                 value={isStaticValue ? 'STATIC_VALUE' : condition.right.type}
                 onChange={handleRightSourceChange}
                 className={`bg-transparent text-xs outline-none font-medium cursor-pointer ${isStaticValue ? 'text-indigo-300' : 'text-slate-200'}`}
              >
                 <option value="STATIC_VALUE" className="bg-slate-900 text-indigo-400 font-bold">★ Static Value</option>
                 <option disabled>──────────</option>
                 {Object.values(IndicatorType).map(t => <option key={t} value={t} className="text-slate-200">{t}</option>)}
              </select>

              {isStaticValue ? (
                // Value Input
                <div className="flex items-center border-l border-indigo-500/30 pl-2">
                   <input 
                    type="number" 
                    value={condition.value} 
                    onChange={(e) => updateCond('value', parseFloat(e.target.value))}
                    className="bg-transparent text-xs text-indigo-200 w-16 outline-none font-mono font-bold"
                    placeholder="Value"
                   />
                </div>
              ) : (
                // Period Input (if indicator logic requires it)
                hasPeriod(condition.right.type) && (
                    <div className="flex items-center border-l border-slate-600 pl-2">
                        <span className="text-[10px] text-slate-500 mr-1">Len</span>
                        <input 
                            type="number" 
                            value={condition.right.period} 
                            onChange={(e) => updateCond('right', { period: parseInt(e.target.value) })} 
                            className="bg-transparent text-xs w-8 text-center text-slate-300 outline-none hover:text-white" 
                        />
                    </div>
                )
              )}
           </div>

           <button onClick={() => updateTree(rootType, condition.id, () => null)} className="ml-auto text-slate-600 hover:text-red-400 p-1">
             <Trash2 size={14} />
           </button>
        </div>
      );
    }

    // --- Render Group ---
    const group = node as LogicGroup;
    const isRoot = depth === 0;
    const borderColor = group.operator === 'AND' ? 'border-emerald-500/30' : 'border-amber-500/30';
    const bgColor = group.operator === 'AND' ? 'bg-emerald-900/5' : 'bg-amber-900/5';
    
    return (
      <div className={`p-3 rounded-xl border ${isRoot ? 'border-slate-800 bg-slate-900/50' : `${borderColor} ${bgColor} ml-4 mt-2 border-l-4`}`}>
        <div className="flex items-center justify-between mb-3">
           <div className="flex items-center gap-2">
             {isRoot ? (
                <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 flex items-center gap-2`}>
                   {rootType === 'ENTRY' ? <Zap size={14} className="text-yellow-400"/> : <Zap size={14} className="text-rose-400"/>}
                   {rootType} LOGIC
                </span>
             ) : (
                <span className="text-xs font-mono text-slate-500 font-bold tracking-wider">GROUP</span>
             )}
             
             {/* Operator Switch */}
             <div className="flex bg-slate-950 rounded border border-slate-700 p-0.5">
               <button 
                  onClick={() => updateTree(rootType, group.id, (n) => ({...n as LogicGroup, operator: 'AND'}))}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${group.operator === 'AND' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 AND
               </button>
               <button 
                  onClick={() => updateTree(rootType, group.id, (n) => ({...n as LogicGroup, operator: 'OR'}))}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${group.operator === 'OR' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 OR
               </button>
             </div>
           </div>

           <div className="flex items-center gap-2">
              <button onClick={() => addCondition(rootType, group.id)} className="text-[10px] flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300 border border-slate-700 transition-colors">
                <Plus size={10} /> Condition
              </button>
              <button onClick={() => addGroup(rootType, group.id)} className="text-[10px] flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300 border border-slate-700 transition-colors">
                <FolderTree size={10} /> Group
              </button>
              {!isRoot && (
                <button onClick={() => updateTree(rootType, group.id, () => null)} className="text-slate-600 hover:text-red-400 ml-2">
                  <Trash2 size={14} />
                </button>
              )}
           </div>
        </div>

        <div className="space-y-2">
           {group.children.length === 0 && (
             <div className="text-center p-4 border border-dashed border-slate-800 rounded text-slate-600 text-xs italic">
               No conditions in this group.
             </div>
           )}
           {group.children.map(child => (
             <LogicNodeBuilder 
                key={child.id} 
                node={child} 
                rootType={rootType} 
                depth={depth + 1}
                updateTree={updateTree}
                addCondition={addCondition}
                addGroup={addGroup}
             />
           ))}
        </div>
      </div>
    );
  };

const StrategyBuilder: React.FC<Props> = ({ strategy, setStrategy }) => {

  const updateTree = (root: 'ENTRY' | 'EXIT', targetId: string, transform: (n: StrategyNode) => StrategyNode | null) => {
    setStrategy(prev => ({
      ...prev,
      [root === 'ENTRY' ? 'entryLogic' : 'exitLogic']: updateNode(
        prev[root === 'ENTRY' ? 'entryLogic' : 'exitLogic'],
        targetId,
        transform
      )
    }));
  };

  const addCondition = (root: 'ENTRY' | 'EXIT', groupId: string) => {
    const newCondition: Condition = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'CONDITION',
      left: { type: IndicatorType.RSI, period: 14 },
      comparator: Comparator.LESS_THAN,
      right: { type: IndicatorType.PRICE, period: 0 }, // Default placeholder
      value: 30 // Default if switched to static
    };
    
    updateTree(root, groupId, (node) => {
      const group = node as LogicGroup;
      return { ...group, children: [...group.children, newCondition] };
    });
  };

  const addGroup = (root: 'ENTRY' | 'EXIT', groupId: string) => {
     const newGroup: LogicGroup = {
       id: Math.random().toString(36).substr(2, 9),
       type: 'GROUP',
       operator: 'AND',
       children: []
     };

     updateTree(root, groupId, (node) => {
       const group = node as LogicGroup;
       return { ...group, children: [...group.children, newGroup] };
     });
  };

  return (
    <div className="space-y-6">
      <LogicNodeBuilder 
        node={strategy.entryLogic} 
        rootType="ENTRY" 
        depth={0} 
        updateTree={updateTree} 
        addCondition={addCondition} 
        addGroup={addGroup} 
      />
      <LogicNodeBuilder 
        node={strategy.exitLogic} 
        rootType="EXIT" 
        depth={0} 
        updateTree={updateTree} 
        addCondition={addCondition} 
        addGroup={addGroup} 
      />

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-500 block mb-1 font-semibold">Stop Loss (%)</label>
          <div className="relative">
            <input 
              type="number" 
              value={strategy.stopLossPct}
              onChange={(e) => setStrategy(s => ({...s, stopLossPct: parseFloat(e.target.value)}))}
              className="w-full bg-slate-800 border border-slate-700 rounded pl-2 pr-8 py-1.5 text-slate-200 text-sm focus:border-red-500 outline-none transition-colors"
            />
            <span className="absolute right-3 top-1.5 text-slate-500 text-xs">%</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1 font-semibold">Take Profit (%)</label>
          <div className="relative">
            <input 
              type="number" 
              value={strategy.takeProfitPct}
              onChange={(e) => setStrategy(s => ({...s, takeProfitPct: parseFloat(e.target.value)}))}
              className="w-full bg-slate-800 border border-slate-700 rounded pl-2 pr-8 py-1.5 text-slate-200 text-sm focus:border-emerald-500 outline-none transition-colors"
            />
            <span className="absolute right-3 top-1.5 text-slate-500 text-xs">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyBuilder;
