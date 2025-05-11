import React, { createContext, useContext, useState } from 'react';
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

const TabsContext = createContext<TabsContextType | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabsContext must be used within a TabsProvider');
  }
  return context;
}

export function Tabs({ children }: TabsProps) {
  // Find the first TabItem to set as default active tab
  const firstTabValue = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === TabItem
  ) as React.ReactElement<TabItemProps> | undefined;

  const [activeValue, setActiveValue] = useState<string>(
    firstTabValue?.props.value || ''
  );

  return (
    <TabsContext.Provider value={{ activeValue, setActiveValue }}>
      <div className="mb-4">
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabItem({ value, title, children }: TabItemProps) {
  const { activeValue, setActiveValue } = useTabsContext();
  const isActive = activeValue === value;

  // Only render tab content for the active tab
  if (!isActive) return null;

  return (
    <div className="border rounded-md p-4 mt-2">
      {children}
    </div>
  );
}

export function TabsList({ children }: { children: React.ReactNode }) {
  const { activeValue, setActiveValue } = useTabsContext();

  return (
    <div className="flex border-b mb-0">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === TabTrigger) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isActive: activeValue === child.props.value,
            onClick: () => setActiveValue(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabTrigger({
  value,
  children,
  isActive,
  onClick,
}: {
  value: string;
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        'px-3 py-2 border-b-2 text-sm font-medium',
        isActive
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:border-gray-600 hover:text-gray-300'
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
