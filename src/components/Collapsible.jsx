import { useCollapsible } from '../hooks/useCollapsible.js';
import { ChevronDownIcon } from './icons.jsx';

/**
 * Shared collapsible card used by the add form and the category panel.
 * Class names are passed in so each section keeps its existing CSS hooks.
 */
const Collapsible = ({
  as: Root = 'section',
  id,
  className,
  ariaLabelledby,
  storageKey,
  datasetKey,
  headClassName,
  headerClassName,
  header,
  bodyId,
  bodyClassName,
  innerClassName,
  labels,
  children,
}) => {
  const { collapsed, toggle, bodyRef, innerRef } = useCollapsible({ storageKey, datasetKey });

  const handleHeaderKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <Root id={id} className={`${className}${collapsed ? ' is-collapsed' : ''}`} aria-labelledby={ariaLabelledby}>
      <div className={headClassName}>
        <div className={headerClassName} role="button" tabIndex={0} onClick={toggle} onKeyDown={handleHeaderKeyDown}>
          {header}
        </div>
        <button
          type="button"
          className="form-collapse-btn"
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          aria-label={collapsed ? labels.expand : labels.collapse}
          title={collapsed ? 'Expand' : 'Collapse'}
          onClick={toggle}
        >
          <ChevronDownIcon className="form-collapse-icon" />
        </button>
      </div>

      <div id={bodyId} ref={bodyRef} className={bodyClassName}>
        <div ref={innerRef} className={innerClassName}>
          {children}
        </div>
      </div>
    </Root>
  );
};

export default Collapsible;
