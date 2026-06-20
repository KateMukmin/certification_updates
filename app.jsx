// Root app — clean worker cert list page + modal-centric add/edit.
// Loads after components.jsx, modals.jsx, tweaks-panel.jsx.

const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA, useRef: useRefA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "newProjectAdded": false,
  "showCompletionStatus": true
}/*EDITMODE-END*/;

function formatDate(s) {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

// Filter dropdown ("All Projects" style)
function FilterDropdown({ value, onChange, options, label }) {
  const [open, setOpen] = useStateA(false);
  const ref = useRefA(null);
  useEffectA(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  const selectedLabel = options.find(o => o.value === value)?.label || label;
  return (
    <div ref={ref} style={{position:'relative'}}>
      <button className="filter-chip" onClick={() => setOpen(o => !o)}>
        {selectedLabel}
        <Icon name="chevDown" size={16} className="chev" />
      </button>
      {open && (
        <div className="filter-menu reveal">
          {options.map(o => (
            <div
              key={o.value || 'all'}
              className={`filter-item ${value === o.value ? 'selected' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.swatch && <span style={{
                width:8, height:8, borderRadius:'50%', background:o.swatch
              }} />}
              {o.label}
              {value === o.value && <span className="check"><Icon name="check" size={14}/></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CertTableRow({ cert, catalog, projects, onClick, showStatus, onViewProjects }) {
  const cat = catalog.find(c => c.id === cert.catalogId);
  const complete = isCertComplete(cert, projects);
  const requiring = projectsRequiringCert(cert.catalogId, projects);
  const missing = missingFields(cert, projects);

  return (
    <div className="cert-trow" onClick={onClick}>
      <div className="name">
        {cat?.name}
        {showStatus && !complete && (
          <span className="attn">
            <span className="mini-warn">
              <span className="dot" />
              Needs {missing.length} {missing.length === 1 ? 'field' : 'fields'}
            </span>
          </span>
        )}
      </div>
      <div className={`v ${cert.certId ? '' : 'muted'}`}>{cert.certId || '—'}</div>
      <div className="v">{formatDate(cert.issueDate)}</div>
      <div className={`v ${cert.expirationDate ? '' : 'muted'}`}>{formatDate(cert.expirationDate)}</div>
      <div className="projects">
        {requiring.length === 0 ? (
          <span style={{color:'var(--text-3)', fontSize:13}}>—</span>
        ) : (
          <button
            type="button"
            className="view-projects-btn"
            onClick={(e) => { e.stopPropagation(); onViewProjects(); }}
          >
            <Icon name="layers" size={13} />
            View
            <span className="count">{requiring.length}</span>
          </button>
        )}
      </div>
      <div className="cert-actions">
        {cert.media && (
          <button className="ic" onClick={(e) => { e.stopPropagation(); }} title="View document">
            <Icon name="file" size={16} />
          </button>
        )}
        <button className="ic" onClick={(e) => { e.stopPropagation(); }} title="More">
          <span style={{fontSize:18, lineHeight:0, letterSpacing:1}}>···</span>
        </button>
      </div>
    </div>
  );
}

function App() {
  const data = window.__APP_DATA__;
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [projects, setProjects] = useStateA(data.projects);
  const [certs, setCerts] = useStateA(data.certs);
  const [activeTab, setActiveTab] = useStateA('certifications');
  const [filter, setFilter] = useStateA(null); // null = all projects
  const [openModal, setOpenModal] = useStateA(null);
  // openModal: { kind: 'add' } | { kind: 'edit', certIdx } | { kind: 'view-projects', certIdx }
  const [toasts, setToasts] = useStateA([]);

  useEffectA(() => {
    const hasBrooklyn = projects.find(p => p.id === data.newProject.id);
    if (tweaks.newProjectAdded && !hasBrooklyn) {
      setProjects(prev => [...prev, data.newProject]);
      pushToast({
        tone: 'warn',
        title: `${data.newProject.name} added`,
        body: `Existing certs are being re-evaluated. Open any cert flagged "Needs fields" to fill the new requirements.`,
      });
    }
    if (!tweaks.newProjectAdded && hasBrooklyn) {
      setProjects(prev => prev.filter(p => p.id !== data.newProject.id));
    }
  }, [tweaks.newProjectAdded]);

  function pushToast(t) {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...t, id }]);
  }
  function dismissToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  function onAdd(newCert) {
    setCerts(prev => [{...newCert}, ...prev]);
    setOpenModal(null);
    const cat = data.catalog.find(c => c.id === newCert.catalogId);
    pushToast({
      tone: 'success',
      title: `${cat?.name} added`,
      body: 'Counted toward every project that requires it.',
    });
  }
  function onEditSave(updated) {
    setCerts(prev => prev.map((c, i) => i === openModal.certIdx ? updated : c));
    setOpenModal(null);
    pushToast({
      tone: 'success',
      title: 'Changes saved',
      body: 'Requirements re-evaluated across all assigned projects.',
    });
  }

  // Filter logic
  const visibleCerts = useMemoA(() => {
    if (!filter) return certs;
    return certs.filter(c => {
      const requiring = projectsRequiringCert(c.catalogId, projects);
      return requiring.some(p => p.id === filter);
    });
  }, [certs, projects, filter]);

  const incompleteCount = certs.filter(c => !isCertComplete(c, projects)).length;

  const projectOptions = [
    { value: null, label: 'All Projects' },
    ...projects.map(p => ({ value: p.id, label: p.shortName, swatch: p.color })),
  ];

  const TABS = [
    { id: 'projects', label: 'Projects' },
    { id: 'activity', label: 'Activity' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'trainings', label: 'Trainings' },
    { id: 'learning', label: 'FCA Learning' },
    { id: 'observations', label: 'Observations' },
    { id: 'drug', label: 'Drug Testing' },
    { id: 'info', label: 'Information' },
  ];

  return (
    <>
      <div className="app">
        <header className="topbar">
          <img className="topbar-logo" src="assets/fca-logo.svg" alt="Field Control Analytics" />
        </header>
        <div className="app-main">
          {/* Breadcrumb */}
          <div className="crumb">
            <span>Workers</span>
            <Icon name="chevRight" size={12} className="sep" />
            <span className="current">{data.worker.name}</span>
          </div>

          {/* Worker line */}
          <div className="worker-row">
            <div className="avatar-lg">{data.worker.initials}</div>
            <div>
              <div className="name">{data.worker.name}</div>
              <div className="meta">{data.worker.role} · {data.worker.location}</div>
            </div>
          </div>

          {/* Top tabs */}
          <div className="tabs-top">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`t ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tools row */}
          <div className="tools-row">
            <FilterDropdown
              value={filter}
              onChange={setFilter}
              options={projectOptions}
              label="All Projects"
            />
            <div style={{display:'flex', gap:10}}>
              <button
                className="btn secondary"
                onClick={() => setOpenModal({ kind: 'see-requirements' })}
              >
                See Requirements
              </button>
              <button className="btn primary" onClick={() => setOpenModal({ kind: 'add' })}>
                Add Certification
              </button>
            </div>
          </div>

          {/* Cert table */}
          <div className="cert-table">
            <div className="cert-thead">
              <div>Name</div>
              <div>Certification ID</div>
              <div>Issue Date</div>
              <div>Expiration Date</div>
              <div>Projects</div>
              <div />
            </div>
            {visibleCerts.length === 0 ? (
              <div className="empty">
                No certifications {filter ? 'match this filter' : 'yet'}.
              </div>
            ) : (
              visibleCerts.map((c) => {
                const realIdx = certs.indexOf(c);
                return (
                  <CertTableRow
                    key={realIdx}
                    cert={c}
                    catalog={data.catalog}
                    projects={projects}
                    showStatus={tweaks.showCompletionStatus}
                    onClick={() => setOpenModal({ kind: 'edit', certIdx: realIdx })}
                    onViewProjects={() => setOpenModal({ kind: 'view-projects', certIdx: realIdx })}
                  />
                );
              })
            )}
          </div>

          {/* Pagination (decorative — matches screenshot) */}
          {visibleCerts.length > 0 && (
            <div className="pagination">
              <button className="pg arrow"><Icon name="chevRight" size={14} style={{transform:'rotate(180deg)'}} /></button>
              <button className="pg active">1</button>
              <button className="pg arrow"><Icon name="chevRight" size={14} /></button>
            </div>
          )}

          {incompleteCount > 0 && tweaks.showCompletionStatus && (
            <div style={{marginTop:32, color:'var(--text-2)', fontSize:13, textAlign:'center'}}>
              {incompleteCount} certification{incompleteCount === 1 ? '' : 's'} need additional fields for one or more assigned projects.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {openModal?.kind === 'add' && (
        <CertModal
          mode="add"
          catalog={data.catalog}
          projects={projects}
          existingCatalogIds={certs.map(c => c.catalogId)}
          onOpenExisting={(catId) => {
            const idx = certs.findIndex(c => c.catalogId === catId);
            if (idx >= 0) setOpenModal({ kind: 'edit', certIdx: idx });
          }}
          onClose={() => setOpenModal(null)}
          onSave={onAdd}
        />
      )}
      {openModal?.kind === 'edit' && (
        <CertModal
          mode="edit"
          initialCert={certs[openModal.certIdx]}
          catalog={data.catalog}
          projects={projects}
          onClose={() => setOpenModal(null)}
          onSave={onEditSave}
        />
      )}
      {openModal?.kind === 'view-projects' && (
        <ProjectRequirementsModal
          cert={certs[openModal.certIdx]}
          catalog={data.catalog}
          projects={projects}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal?.kind === 'see-requirements' && (
        <AllRequirementsModal
          projects={projects}
          catalog={data.catalog}
          onClose={() => setOpenModal(null)}
        />
      )}

      {/* Toasts */}
      <div className="toast-host">
        {toasts.map(t => (
          <Toast
            key={t.id}
            tone={t.tone}
            title={t.title}
            body={t.body}
            onClose={() => dismissToast(t.id)}
          />
        ))}
      </div>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks" subtitle="Demonstrate the new flow">
        <TweakSection title="Demo">
          <TweakToggle
            label="Add a new project to this worker"
            description="Adds Brooklyn Bridge Maintenance, which requires extra fields on Asbestos & OSHA 30. Existing certs flip to 'Needs fields'."
            value={tweaks.newProjectAdded}
            onChange={(v) => setTweak('newProjectAdded', v)}
          />
          <TweakToggle
            label="Show completion status in table"
            description="Toggle the inline 'Needs N fields' indicator next to incomplete cert names."
            value={tweaks.showCompletionStatus}
            onChange={(v) => setTweak('showCompletionStatus', v)}
          />
        </TweakSection>
        <TweakSection title="Try this">
          <div style={{fontSize:12, color:'var(--text-2)', lineHeight:1.6}}>
            1. Click <strong>Add Certification</strong>. Pick "Asbestos" — the requirements panel lists every project that needs it and exactly which fields each one demands. Form fields update with required asterisks.<br/><br/>
            2. Click any existing cert (e.g. <strong>OSHA 30</strong>) to edit. Same panel, same data — no tab switching needed.<br/><br/>
            3. Flip <strong>Add new project</strong>. Watch Asbestos & OSHA 30 flag as needing additional fields. Open them — the requirements panel now shows the new project's row with red "missing" pills.
          </div>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
