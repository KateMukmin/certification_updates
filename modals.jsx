// Cert modal — unified Add/Edit. Single screen, no internal tabs.
// Requirements panel sits below the cert picker and lists each project + its
// per-project required fields, color-coded by whether the value is filled.

const { useState: useStateM, useEffect: useEffectM, useMemo: useMemoM } = React;

function fieldFilled(field, form) {
  if (field === 'issueDate') return !!form.issueDate;
  if (field === 'expiration') return !!form.expirationDate;
  if (field === 'certId') return !!form.certId;
  if (field === 'description') return !!form.description;
  if (field === 'media') return !!form.media;
  return false;
}

function RequirementsPanel({ catalogId, projects, form }) {
  const requiring = projectsRequiringCert(catalogId, projects);
  const [open, setOpen] = useStateM(false);

  // Count of projects with missing required fields — drives the small status hint
  const missingProjectCount = useMemoM(() => {
    return requiring.filter(p => {
      const extra = projectExtraRequired(p, catalogId);
      if (!form.issueDate) return true;
      for (const f of extra) {
        if (!fieldFilled(f, form)) return true;
      }
      return false;
    }).length;
  }, [requiring, catalogId, form]);

  const headerText = requiring.length === 0
    ? 'Required by 0 projects'
    : `Required by ${requiring.length} ${requiring.length === 1 ? 'project' : 'projects'}`;

  return (
    <div className="req-panel reveal">
      <button
        type="button"
        className="req-panel-head as-button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="req-panel-title">
          <span className="ic"><Icon name="layers" size={14} /></span>
          {headerText}
        </div>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          {requiring.length > 0 && (
            missingProjectCount > 0
              ? <ChipBadge kind="warn" dot>{missingProjectCount} need more info</ChipBadge>
              : <ChipBadge kind="success" dot>All satisfied</ChipBadge>
          )}
          <span className={`req-chev ${open ? 'open' : ''}`}>
            <Icon name="chevDown" size={16} />
          </span>
        </div>
      </button>

      {open && requiring.length === 0 && (
        <div className="req-panel-empty reveal">
          You can still upload it. Name and Issue Date are the only required fields.
        </div>
      )}

      {open && requiring.length > 0 && (
        <div className="req-rows reveal">
          {requiring.map(p => {
            const extra = projectExtraRequired(p, catalogId);
            const fields = [
              { key: 'issueDate', label: 'Issue Date', universal: true, satisfied: !!form.issueDate },
              ...extra.map(f => ({
                key: f,
                label: __FIELD_LABELS__[f],
                universal: false,
                satisfied: fieldFilled(f, form),
              })),
            ];
            const groupLabels = groupLabelsForProject(p, catalogId);
            return (
              <div key={p.id} className="req-row">
                <div className="proj">
                  <span className="swatch" style={{ background: p.color }} />
                  {p.name}
                </div>
                <div className="group">
                  {groupLabels.map((g, i) => (
                    <React.Fragment key={g}>
                      <strong>{g}</strong>{i < groupLabels.length - 1 ? ' · ' : ''}
                    </React.Fragment>
                  ))}
                </div>
                <div className="fields">
                  {fields.map(f => {
                    let cls = 'req-pill';
                    if (f.universal) cls += ' universal';
                    else if (f.satisfied) cls += ' satisfied';
                    else cls += ' missing';
                    return (
                      <span key={f.key} className={cls}>
                        <span className="dot" />
                        {f.label}
                        {!f.universal && f.satisfied && <Icon name="check" size={11} />}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Unified Cert Modal (Add or Edit) ----------
function CertModal({ mode, initialCert, catalog, projects, onClose, onSave, existingCatalogIds = [], onOpenExisting }) {
  const isEdit = mode === 'edit';
  const [catalogId, setCatalogId] = useStateM(initialCert?.catalogId || '');
  const [certId, setCertId] = useStateM(initialCert?.certId || '');
  const [issueDate, setIssueDate] = useStateM(initialCert?.issueDate || '');
  const [expirationDate, setExpirationDate] = useStateM(initialCert?.expirationDate || '');
  const [description, setDescription] = useStateM(initialCert?.description || '');
  const [media, setMedia] = useStateM(initialCert?.media || null);
  const [submitted, setSubmitted] = useStateM(false);
  const [hoverField, setHoverField] = useStateM(null);
  const [dupNotice, setDupNotice] = useStateM(null); // name of cert the user tried to re-add

  const form = { catalogId, certId, issueDate, expirationDate, description, media };
  const heldSet = useMemoM(() => new Set(existingCatalogIds), [existingCatalogIds]);

  const requiringProjects = useMemoM(
    () => catalogId ? projectsRequiringCert(catalogId, projects) : [],
    [catalogId, projects]
  );
  const unionExtra = useMemoM(
    () => catalogId ? unionExtraRequired(catalogId, requiringProjects) : [],
    [catalogId, requiringProjects]
  );

  const items = useMemoM(
    () => catalog.map(c => ({ value: c.id, label: c.name, held: !isEdit && heldSet.has(c.id) })),
    [catalog, heldSet, isEdit]
  );

  // In Add mode, picking a cert the worker already holds is not allowed —
  // route the user to the existing record instead of creating a duplicate.
  const handlePick = (v) => {
    if (!isEdit && heldSet.has(v)) {
      const c = catalog.find(c => c.id === v);
      setDupNotice(c?.name || 'This certification');
      return;
    }
    setDupNotice(null);
    setCatalogId(v);
    setSubmitted(false);
  };

  const isReq = (field) => {
    if (!catalogId) return false;
    if (field === 'issueDate') return true;
    return unionExtra.includes(field);
  };

  const missing = () => {
    if (!catalogId) return ['catalogId'];
    const m = [];
    if (!issueDate) m.push('issueDate');
    if (isReq('expiration') && !expirationDate) m.push('expiration');
    if (isReq('certId') && !certId) m.push('certId');
    if (isReq('description') && !description) m.push('description');
    if (isReq('media') && !media) m.push('media');
    return m;
  };

  const showError = (field) => submitted && isReq(field) && missing().includes(field);

  const canSave = catalogId;  // we still let user save with warnings — the row will surface missing fields

  const handleSave = () => {
    setSubmitted(true);
    if (!canSave) return;
    onSave({
      catalogId, certId, issueDate, expirationDate, description, media,
    });
  };

  // Field highlight when hovering a requirements pill
  const fieldHighlight = (field) => hoverField === field;

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-subtitle" style={{textTransform:'uppercase'}}>
              {isEdit ? 'Edit certification' : 'Add certification'}
            </div>
            <div className="modal-title">
              {isEdit
                ? (catalog.find(c => c.id === catalogId)?.name || 'Certification')
                : 'New certification'}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body">
          {/* Cert picker — locked in edit mode */}
          <div style={{marginBottom: 22}}>
            <Dropdown
              label="Certifications"
              required
              value={catalogId}
              onChange={handlePick}
              items={items}
              placeholder="Select a certification"
              hasError={submitted && !catalogId}
              disabled={isEdit}
            />
          </div>

          {/* Duplicate guard — picking an already-held cert routes to the existing record */}
          {dupNotice && (
            <div className="reveal" style={{marginBottom: 24, marginTop: -8}}>
              <div className="banner warn">
                <span className="banner-icon">
                  <Icon name="info" size={20} color="var(--warn)" />
                </span>
                <div className="banner-body">
                  <strong>{dupNotice}</strong> is already on this worker's profile.
                  A certification can only exist once — open the existing record to update it.
                  <div style={{marginTop: 12}}>
                    <button
                      type="button"
                      className="btn secondary"
                      style={{padding: '8px 18px'}}
                      onClick={() => {
                        const id = catalog.find(c => c.name === dupNotice)?.id;
                        if (id && onOpenExisting) onOpenExisting(id);
                      }}
                    >
                      Go to existing record
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Requirements panel — collapsible, collapsed by default */}
          {catalogId && (
            <RequirementsPanel
              catalogId={catalogId}
              projects={projects}
              form={form}
            />
          )}

          {/* Section: details */}
          {catalogId && (
            <div className="section-divider">
              <span className="lbl">Certification details</span>
              <span className="ln" />
            </div>
          )}

          <div className="form-grid">
            <TextField
              label="Certification ID"
              value={certId}
              onChange={setCertId}
              required={isReq('certId')}
              optional
              hasError={showError('certId')}
            />
            <DateField
              label="Issue Date"
              value={issueDate}
              onChange={setIssueDate}
              required={!!catalogId}
              hasError={showError('issueDate')}
            />
            <DateField
              label="Expiration Date"
              value={expirationDate}
              onChange={setExpirationDate}
              required={isReq('expiration')}
              optional
              hasError={showError('expiration')}
            />
            <div className="span-2">
              <TextArea
                label="Description"
                value={description}
                onChange={setDescription}
                required={isReq('description')}
                optional
                hasError={showError('description')}
              />
            </div>
            <div />
            <div className="span-3" style={{marginTop:4}}>
              <Upload
                label="Media"
                value={media}
                onChange={setMedia}
                required={isReq('media')}
                optional
                hasError={showError('media')}
              />
            </div>
          </div>

          {submitted && missing().length > 0 && (
            <div className="reveal" style={{marginTop:22}}>
              <Banner tone="warn" icon="warn">
                <strong>{missing().filter(f => f !== 'catalogId').length} required field(s)</strong>
                {' '}still need values to satisfy every assigned project. Fields outlined in red above.
              </Banner>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn ghost" onClick={onClose}>Close</button>
          <button className="btn primary" onClick={handleSave} disabled={!catalogId}>
            {isEdit ? 'Save Changes' : 'Add Certification'}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CertModal, RequirementsPanel, ProjectRequirementsModal, AllRequirementsModal, ProjectProfile });

// ---------- Project Requirements Modal ----------
// Triggered by the "View" button on a cert's Projects column.
// Simple list of projects that need this cert.
function ProjectRequirementsModal({ cert, catalog, projects, onClose }) {
  const requiring = projectsRequiringCert(cert.catalogId, projects);
  const catalogEntry = catalog.find(c => c.id === cert.catalogId);

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal pr-modal-simple" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-subtitle" style={{textTransform:'uppercase'}}>
              Required by
            </div>
            <div className="modal-title">{catalogEntry?.name}</div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body" style={{padding: '20px 28px 24px'}}>
          <div className="simple-proj-list">
            {requiring.map(p => (
              <div key={p.id} className="simple-proj-row">
                <span className="swatch" style={{background:p.color}} />
                <span className="name">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <span style={{fontSize:12, color:'var(--text-2)'}}>
            This certification counts toward {requiring.length} {requiring.length === 1 ? 'project' : 'projects'}.
          </span>
          <button className="btn primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ---------- All Requirements Modal ----------
// Triggered by the "See Requirements" button next to "Add Certification".
// Shows every project the worker is assigned to, with full requirement breakdown.
function AllRequirementsModal({ projects, catalog, onClose }) {
  const [activeProjectId, setActiveProjectId] = useStateM(projects[0]?.id || null);
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal pr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-subtitle" style={{textTransform:'uppercase'}}>
              Project requirements
            </div>
            <div className="modal-title">Certification requirements by project</div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div className="pr-body">
          <aside className="pr-rail">
            <div className="pr-rail-title">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} assigned
            </div>
            {projects.map(p => (
              <button
                key={p.id}
                className={`pr-rail-item ${activeProject?.id === p.id ? 'active' : ''}`}
                onClick={() => setActiveProjectId(p.id)}
              >
                <span className="swatch" style={{background:p.color}} />
                <span className="lbl">{p.shortName}</span>
                <Icon name="chevRight" size={14} />
              </button>
            ))}
          </aside>

          <section className="pr-main">
            {activeProject && (
              <ProjectProfile
                project={activeProject}
                catalog={catalog}
                highlightCertId={null}
              />
            )}
          </section>
        </div>

        <div className="modal-footer">
          <span style={{fontSize:12, color:'var(--text-2)'}}>
            Select a project on the left to view its full certification requirements.
          </span>
          <button className="btn primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

// Renders one project's full requirements profile: every cert group + its fields.
function ProjectProfile({ project, catalog, highlightCertId }) {
  return (
    <div>
      <div className="pr-proj-head">
        <div className="pr-proj-swatch" style={{background: project.color}} />
        <div>
          <div className="pr-proj-name">{project.name}</div>
          <div className="pr-proj-sub">
            {project.groups.length} certification {project.groups.length === 1 ? 'group' : 'groups'}
          </div>
        </div>
      </div>

      <div className="pr-groups">
        {project.groups.map((g, i) => {
          const ruleLabel = g.rule === 'all' ? 'All mandatory' : 'At least one is mandatory';
          const ruleClass = g.rule === 'all' ? 'rule-all' : 'rule-any';
          const containsHighlight = g.certIds.includes(highlightCertId);
          return (
            <div key={i} className={`pr-group ${containsHighlight ? 'highlight' : ''}`}>
              <div className="pr-group-head">
                <div className="pr-group-title">
                  {g.label}
                  <span className={`rule-pill ${ruleClass}`}>{ruleLabel}</span>
                  {containsHighlight && (
                    <span className="rule-pill rule-current">Includes this cert</span>
                  )}
                </div>
              </div>

              <div className="pr-group-section">
                <div className="pr-section-lbl">Certifications in this group</div>
                <div className="pr-cert-grid">
                  {g.certIds.map(cid => {
                    const c = catalog.find(c => c.id === cid);
                    const isHighlight = cid === highlightCertId;
                    return (
                      <div key={cid} className={`pr-cert-item ${isHighlight ? 'highlight' : ''}`}>
                        <Icon name={isHighlight ? 'check' : 'file'} size={14}
                          color={isHighlight ? 'var(--brand)' : 'var(--text-3)'} />
                        <span>{c?.name || cid}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pr-group-section">
                <div className="pr-section-lbl">Required fields per certification</div>
                <div className="pr-fields-row">
                  <span className="req-pill universal"><span className="dot" />Name</span>
                  <span className="req-pill universal"><span className="dot" />Issue Date</span>
                  {g.extraRequired.length === 0 && (
                    <span style={{fontSize:12, color:'var(--text-3)'}}>
                      No additional fields required.
                    </span>
                  )}
                  {g.extraRequired.map(f => (
                    <span key={f} className="req-pill brand-pill">
                      <span className="dot" />{__FIELD_LABELS__[f]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
