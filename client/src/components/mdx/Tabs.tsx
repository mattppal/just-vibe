import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  children: React.ReactNode;
}

interface TabItemProps {
  value: string;
  title: string;
  children: React.ReactNode;
}

type TabsContextType = {
  activeValue: string;
  setActiveValue: (value: string) => void;
  children?: React.ReactNode;
};

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

export function Tabs({ children }: TabsProps) {
  // Find all child TabItems to get their values
  const childArray = React.Children.toArray(children);
  const firstTabValue = (childArray[0] as React.ReactElement<TabItemProps>)?.props?.value || '';
  
  const [activeValue, setActiveValue] = useState<string>(firstTabValue);
  
  return (
    <TabsContext.Provider value={{ activeValue, setActiveValue, children }}>
      <div className="my-6">
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabItem({ value, title, children }: TabItemProps) {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('TabItem must be used within a Tabs component');
  }
  
  const { activeValue, setActiveValue } = context;
  const isActive = activeValue === value;
  
  // Only render tab content when it's active
  return (
    <>
      {/* Render this only for the first TabItem to avoid duplicating the tab bar */}
      {React.Children.toArray(context.children)[0] === children && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          {React.Children.map(context.children, (child: any) => (
            <button
              key={child.props.value}
              className={cn(
                'px-4 py-2 text-sm font-medium',
                'focus:outline-none',
                child.props.value === activeValue
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-500'
              )}
              onClick={() => setActiveValue(child.props.value)}
            >
              {child.props.title}
            </button>
          ))}
        </div>
      )}
      
      {/* Tab content */}
      {isActive && (
        <div className="tab-content">
          {children}
        </div>
      )}
    </>
  );
}

TabItem.displayName = 'TabItem';
