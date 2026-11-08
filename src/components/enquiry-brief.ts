type Brief = {role: string; requirement: string; location: string; name: string; email: string}
export function enquiryBrief(draft: Brief, category: string, recipient: string) {
  const subject = `BS EXIMNEXUS — ${category.replace(/[\r\n]/g, ' ')} enquiry`
  const text = `Product area: ${category}\nVisitor type: ${draft.role}\n\n${draft.requirement}\n\nDestination or business location: ${draft.location}\nName: ${draft.name}\nEmail: ${draft.email}`
  const base = `mailto:${recipient}?subject=${encodeURIComponent(subject)}`
  const full = `${base}&body=${encodeURIComponent(text)}`
  return {text, href: full.length <= 1800 ? full : base, copyRequired: full.length > 1800}
}
