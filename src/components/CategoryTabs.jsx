import { useEffect, useRef, useState } from 'react';
import Collapsible from './Collapsible.jsx';
import { TagIcon } from './icons.jsx';

const CategoryTabs = ({ tabs, activeCategory, onSelect }) => {
  const tabsRef = useRef(null);
  const [scrollable, setScrollable] = useState(false);
  const visible = tabs.length > 0;

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return undefined;
    const checkOverflow = () => setScrollable(el.scrollWidth > el.clientWidth + 2);
    checkOverflow();
    el.addEventListener('scroll', checkOverflow, { passive: true });
    window.addEventListener('resize', checkOverflow);
    return () => {
      el.removeEventListener('scroll', checkOverflow);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [tabs]);

  const handleClick = (id) => {
    if (id === activeCategory) return;
    onSelect(id);
    requestAnimationFrame(() => {
      tabsRef.current?.querySelector('.category-tab.is-active')?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    });
  };

  return (
    <section className={`category-tabs-section${visible ? '' : ' hidden'}`} aria-label="Filter by category">
      <Collapsible
        as="div"
        id="category-panel"
        className="category-tabs-panel"
        storageKey="bm-categories-collapsed"
        datasetKey="categoriesCollapsed"
        headClassName="category-tabs-head"
        headerClassName="category-tabs-title category-header-toggle"
        header={
          <>
            <TagIcon size={15} />
            <span>Browse by category</span>
          </>
        }
        bodyId="category-tabs-body"
        bodyClassName="category-tabs-body"
        innerClassName="category-tabs-body-inner"
        labels={{ expand: 'Expand category filters', collapse: 'Collapse category filters' }}
      >
        <div className={`category-tabs-scroll-wrap${scrollable ? ' is-scrollable' : ''}`}>
          <div ref={tabsRef} className="category-tabs" role="tablist">
            {tabs.map((tab) => {
              const isActive = tab.id === activeCategory;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`category-tab${isActive ? ' is-active' : ''}`}
                  role="tab"
                  aria-selected={isActive}
                  data-category={tab.id}
                  onClick={() => handleClick(tab.id)}
                >
                  <span className="category-tab-label">{tab.label}</span>
                  <span className="category-tab-count" aria-label={`${tab.count} bookmarks`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Collapsible>
    </section>
  );
};

export default CategoryTabs;
