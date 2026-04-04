1. **Site Purpose Summary**  
The Nashville Musicians Association website serves as an informational and resource hub for professional musicians in Nashville. It promotes union membership benefits, provides news, events, contracts, resources for gigs, recordings, member services, directories for musicians and bands, and educational materials related to music industry standards and labor rights.

2. **Main Page Groups Inferred**  
- **News & Events:** Latest happenings, seminars, announcements (e.g., news-and-events, event pages)  
- **Membership & Services:** Join, sign in, member site links, member services, member directories, member profile pages  
- **Contracts & Agreements:** Scales, contracts, forms, labor agreements, pension info (e.g., scales-forms-agreements, live-scales-contracts-pension, form LS1 Q&A)  
- **Gig and Artist Resources:** Upcoming gigs, find an artist/band, do not work list, hire a musician  
- **Recording & Live Music Resources:** Recording, live music sections  
- **Union & Advocacy Information:** AFM entertainment, union benefits, union plus program, signatory information  
- **Educational & Informational Content:** What is Sound Exchange?, FAQs, mission statement, about us, media, photo and video gallery, Nashville Musician magazine  
- **Support & Assistance:** Donation pages, COVID-19 resources, free rehearsal hall  
- **Directories:** Public directory, members-only directory, members’ profile pages  
- **Employer & Visitor Information:** Pages aimed at employers and visitors  

3. **Note on What to Preserve Exactly in Static Rebuild**  
- Preserve the site’s informational hierarchy, exact URL structure, and all static content text to maintain SEO and user familiarity.  
- Retain exact layouts, page relationships, links, and navigation menus without redesigning.  
- Keep all downloadable resources and media assets (images, PDFs, contracts, forms) intact with original file names and paths.  
- Preserve member directories and public profile pages as they appear, including any indexable content.  
- Maintain event and news archive content unchanged.

4. **Next.js Migration Checklist (Concise)**  
- [ ] Map existing URLs to Next.js pages with `getStaticProps` and `getStaticPaths` to statically generate content.  
- [ ] Ensure assets (images, downloads) are copied and served from `/public` folder maintaining original paths.  
- [ ] Replicate exact navigation structure via Next.js Layout components with consistent header/footer.  
- [ ] Migrate all static content from HTML to React components preserving markup semantics.  
- [ ] Implement any dynamic client-side features, if required, without changing existing static content behavior.  
- [ ] Configure SEO metadata for each page to mirror current titles, descriptions, and schema if any.  
- [ ] Setup redirects and error handling consistent with current site behavior.  
- [ ] Test all internal links and resources to confirm integrity post-build.  
- [ ] Optimize build for performance with Next.js static export or server-side rendering as appropriate.
