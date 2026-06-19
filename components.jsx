// Shared UI components and helpers.
// Loaded as: <script type="text/babel" src="components.jsx"></script>

const { useState, useEffect, useRef, useMemo } = React;

// ---------- Icon set (inline SVG) ----------
const Icon = ({ name, size = 18, stroke = 1.6, color = 'currentColor', style }) => {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth: stroke,
    strokeLinecap: 'round', strokeLinejoin: 'round', style,
  };
  const paths = {
    close: <path d="M6 6l12 12M18 6L6 18" />,
    chevDown: <path d="M6 9l6 6 6-6" />,
    chevRight: <path d="M9 6l6 6-6 6" />,
    cal: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    upload: <><path d="M12 16V4M5 11l7-7 7 7M4 20h16"/></>,
    cloud: <><path d="M17 16a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.5A4 4 0 0 0 6 17h11z"/><path d="M12 12v6M9 15l3-3 3 3"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    bell: <><path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2zM10 21a2 2 0 0 0 4 0"/></>,
    home: <><path d="M3 12l9-9 9 9v9a1 1 0 0 1-1 1h-4v-7H8v7H4a1 1 0 0 1-1-1z"/></>,
    folder: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></>,
    users: <><circle cx="9" cy="8" r="4"/><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><path d="M19 8a4 4 0 0 1 0 8M23 21v-2a4 4 0 0 0-3-3.87"/></>,
    invoice: <><path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 3 2 3-2 3 2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></>,
    tablet: <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/></>,
    book: <><path d="M4 19V5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 0-2 2zM6 19h14"/></>,
    help: <><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></>,
    info: <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>,
    warn: <><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></>,
    check: <path d="M5 13l4 4L19 7"/>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>,
    trash: <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    layers: <><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></>,
    flag: <><path d="M4 22V4M4 4h12l-2 4 2 4H4"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

// ---------- Pure helpers ----------
function projectsRequiringCert(catalogId, projects) {
  return projects.filter(p => p.groups.some(g => g.certIds.includes(catalogId)));
}
function projectExtraRequired(project, catalogId) {
  const groups = project.groups.filter(g => g.certIds.includes(catalogId));
  const fields = new Set();
  groups.forEach(g => g.extraRequired.forEach(f => fields.add(f)));
  return [...fields];
}
function unionExtraRequired(catalogId, projects) {
  const fields = new Set();
  projects.forEach(p => {
    projectExtraRequired(p, catalogId).forEach(f => fields.add(f));
  });
  return [...fields];
}
function groupLabelsForProject(project, catalogId) {
  return project.groups
    .filter(g => g.certIds.includes(catalogId))
    .map(g => `${g.label} (${g.rule === 'all' ? 'All Mandatory' : 'At least one is mandatory'})`);
}
function isCertComplete(cert, projects) {
  if (!cert.issueDate) return false; // universal required
  const extra = unionExtraRequired(cert.catalogId, projectsRequiringCert(cert.catalogId, projects));
  for (const f of extra) {
    if (f === 'expiration' && !cert.expirationDate) return false;
    if (f === 'certId' && !cert.certId) return false;
    if (f === 'description' && !cert.description) return false;
    if (f === 'media' && !cert.media) return false;
  }
  return true;
}
function missingFields(cert, projects) {
  const extra = unionExtraRequired(cert.catalogId, projectsRequiringCert(cert.catalogId, projects));
  const m = [];
  if (!cert.issueDate) m.push('issueDate');
  for (const f of extra) {
    if (f === 'expiration' && !cert.expirationDate) m.push('expiration');
    if (f === 'certId' && !cert.certId) m.push('certId');
    if (f === 'description' && !cert.description) m.push('description');
    if (f === 'media' && !cert.media) m.push('media');
  }
  return m;
}

// ---------- Dropdown ----------
function Dropdown({
  value, onChange, items, placeholder = 'Select Options',
  label, required, searchable = true, disabled = false, hasError = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(it => it.label.toLowerCase().includes(q));
  }, [items, query]);

  const selected = items.find(it => it.value === value);
  const triggerClass = `dropdown-trigger${open ? ' open' : ''}${hasError ? ' error' : ''}`;

  return (
    <div className={`field ${required ? 'required' : ''} ${selected ? 'filled' : ''} ${hasError ? 'error' : ''}`}>
      {label && <span className="field-label">{label}</span>}
      <div className="dropdown" ref={ref}>
        <button
          type="button"
          className={triggerClass}
          onClick={() => !disabled && setOpen(o => !o)}
          disabled={disabled}
        >
          {selected
            ? <span>{selected.label}</span>
            : <span className="placeholder">{placeholder}</span>}
          <Icon name="chevDown" size={16} className="chev" />
        </button>
        {open && (
          <div className="dropdown-menu reveal">
            {searchable && items.length > 6 && (
              <div className="dropdown-search">
                <input
                  autoFocus
                  placeholder="Search certifications…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            )}
            {filtered.length === 0 && <div className="dropdown-item empty">No matches</div>}
            {filtered.map(it => (
              <div
                key={it.value}
                className={`dropdown-item${value === it.value ? ' selected' : ''}`}
                onClick={() => { onChange(it.value); setOpen(false); setQuery(''); }}
              >
                {it.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Input / Field wrappers ----------
function TextField({ label, value, onChange, placeholder, required, hasError, optional }) {
  const filled = !!value;
  const cls = `field ${required ? 'required' : ''} ${filled ? 'filled' : ''} ${hasError ? 'error' : ''}`;
  const display = label + (optional && !required ? ' (Optional)' : '');
  return (
    <div className={cls}>
      <span className="field-label">{display}</span>
      <input
        className="input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ' '}
      />
    </div>
  );
}

function DateField({ label, value, onChange, required, hasError, optional }) {
  const filled = !!value;
  const cls = `field ${required ? 'required' : ''} ${filled ? 'filled' : ''} ${hasError ? 'error' : ''}`;
  const display = label + (optional && !required ? ' (Optional)' : '');
  return (
    <div className={cls}>
      <span className="field-label">{display}</span>
      <div className="input-date">
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="cal"><Icon name="cal" size={16} /></span>
      </div>
    </div>
  );
}

function TextArea({ label, value, onChange, required, hasError, optional, rows = 3 }) {
  const filled = !!value;
  const cls = `field ${required ? 'required' : ''} ${filled ? 'filled' : ''} ${hasError ? 'error' : ''}`;
  const display = label + (optional && !required ? ' (Optional)' : '');
  return (
    <div className={cls}>
      <span className="field-label">{display}</span>
      <textarea
        className="textarea"
        rows={rows}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Upload({ label, value, onChange, required, hasError, optional }) {
  const filled = !!value;
  return (
    <div className={`form-row`}>
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <span style={{fontSize:13, fontWeight:500, color: required ? 'var(--text-1)' : 'var(--text-2)'}}>
          {label}{!required && optional ? ' (Optional)' : ''}{required ? ' *' : ''}
        </span>
        {required && <span className="chip-badge brand">Required</span>}
      </div>
      <button
        type="button"
        className={`upload ${filled ? 'has-file' : ''} ${hasError ? 'error' : ''} ${required && !filled && !hasError ? 'required' : ''}`}
        onClick={() => onChange(filled ? null : { name: 'safety-card.pdf', size: '486 KB' })}
      >
        <span className="text">
          {filled
            ? `${value.name} · ${value.size}`
            : 'Upload file (Only pdf, jpg, png and gif formats) Max Size: 5 MB'}
        </span>
        <span className="upload-icon"><Icon name={filled ? 'check' : 'cloud'} size={18} /></span>
      </button>
    </div>
  );
}

// ---------- Chip badge ----------
function ChipBadge({ kind = 'neutral', children, dot, style }) {
  return (
    <span className={`chip-badge ${kind}`} style={style}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

// ---------- Banner ----------
function Banner({ tone = 'info', icon = 'info', title, children, projects }) {
  return (
    <div className={`banner ${tone === 'warn' ? 'warn' : ''}`}>
      <span className="banner-icon">
        <Icon name={icon} size={20} color={tone === 'warn' ? 'var(--warn)' : 'var(--brand)'} />
      </span>
      <div className="banner-body">
        {title && <div style={{fontWeight:600, marginBottom:2}}>{title}</div>}
        {children}
        {projects && projects.length > 0 && (
          <div className="banner-projects">
            {projects.map(p => (
              <ChipBadge key={p.id} kind="brand" style={{ background: p.color ? `${p.color}15` : undefined, color: p.color }}>
                {p.shortName}
              </ChipBadge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Toast host ----------
function Toast({ tone = 'warn', title, body, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);
  const iconName = tone === 'success' ? 'check' : tone === 'info' ? 'info' : 'warn';
  return (
    <div className={`toast ${tone}`}>
      <span className="toast-icon"><Icon name={iconName} size={16} /></span>
      <div className="toast-body">
        <div className="toast-title">{title}</div>
        <div>{body}</div>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}

Object.assign(window, {
  Icon, Dropdown, TextField, DateField, TextArea, Upload, ChipBadge, Banner, Toast,
  projectsRequiringCert, projectExtraRequired, unionExtraRequired, groupLabelsForProject,
  isCertComplete, missingFields,
});
