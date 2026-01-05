# Components Guide

This document describes the React components used in the application.

## Component Organization

```
components/
├── Header.tsx           # Navigation header
├── Footer.tsx           # Site footer
├── MarkdownContent.tsx  # Markdown renderer
├── MapPickerModal.tsx   # Location picker
│
├── photo/               # Photo-related
│   ├── LikeButton.tsx   # Like functionality
│   └── index.ts
│
├── lightbox/            # Image lightbox
│   └── EnhancedLightbox.tsx
│
├── comments/            # Comment system
│   ├── CommentForm.tsx
│   ├── CommentList.tsx
│   └── index.ts
│
└── admin/               # Admin panel
    ├── AdminSidebar.tsx
    ├── CategoryManager.tsx
    ├── TagManager.tsx
    ├── TaxonomyManager.tsx
    │
    ├── photos/
    │   ├── PhotoModal.tsx
    │   ├── PhotoListContent.tsx
    │   └── BatchUploadModal.tsx
    │
    ├── articles/
    │   ├── ArticleModal.tsx
    │   └── ArticleListContent.tsx
    │
    ├── albums/
    │   ├── AlbumModal.tsx
    │   └── AlbumListContent.tsx
    │
    ├── media/
    │   ├── MediaUploader.tsx
    │   ├── MediaLibraryContent.tsx
    │   ├── MediaCard.tsx
    │   └── MediaDetailModal.tsx
    │
    ├── analytics/
    │   └── AnalyticsContent.tsx
    │
    └── settings/
        ├── ProfileManager.tsx
        ├── SEOManager.tsx
        └── WatermarkSettings.tsx
```

## Public Components

### Header

Fixed navigation header with active state styling.

```tsx
// Usage
import Header from "@/components/Header";

<Header />
```

**Features:**
- Fixed position with backdrop blur
- Active state based on current route
- Responsive (mobile menu items)
- Teal accent color for active state

### Footer

Site footer with copyright and links.

```tsx
import Footer from "@/components/Footer";

<Footer />
```

### EnhancedLightbox

Full-screen image viewer with navigation.

```tsx
import { EnhancedLightbox } from "@/components/lightbox/EnhancedLightbox";

<EnhancedLightbox
  photos={photos}
  currentIndex={selectedIndex}
  onClose={() => setSelectedIndex(null)}
  onNavigate={(index) => setSelectedIndex(index)}
/>
```

**Features:**
- Keyboard navigation (←, →, Esc)
- Touch swipe support
- Image preloading
- Photo counter
- Link to detail page

### CommentForm / CommentList

Comment system for photos and articles.

```tsx
import { CommentForm, CommentList } from "@/components/comments";

<CommentForm
  photoSlug={photo.slug}
  onCommentAdded={() => refetchComments()}
/>

<CommentList
  comments={comments}
  refreshKey={refreshKey}
/>
```

### LikeButton

Photo like functionality with optimistic UI.

```tsx
import { LikeButton } from "@/components/photo";

<LikeButton photoSlug={photo.slug} />
```

### MapPickerModal

Interactive map for selecting photo location.

```tsx
import MapPickerModal from "@/components/MapPickerModal";

<MapPickerModal
  latitude={photo.latitude}
  longitude={photo.longitude}
  onSelect={(lat, lng) => handleLocationSelect(lat, lng)}
  onClose={() => setShowMap(false)}
/>
```

**Features:**
- Leaflet-based interactive map
- Location search (Nominatim API)
- Click to select coordinates
- Current location marker

### MarkdownContent

Renders markdown content with styling.

```tsx
import MarkdownContent from "@/components/MarkdownContent";

<MarkdownContent content={article.content} />
```

## Admin Components

### AdminSidebar

Navigation sidebar for admin panel.

```tsx
import { AdminSidebar } from "@/components/admin/AdminSidebar";

<AdminSidebar />
```

**Sections:**
- Photos (list, taxonomy)
- Albums
- Blog (list, taxonomy)
- Media
- Comments
- Analytics
- Settings (profile, SEO)

### PhotoModal

Create/edit photo form.

```tsx
import PhotoModal from "@/components/admin/photos/PhotoModal";

<PhotoModal
  photo={selectedPhoto}  // null for new
  onClose={() => setShowModal(false)}
  onSave={() => refetchPhotos()}
/>
```

**Features:**
- AI slug generation
- AI story generation
- EXIF extraction
- Map location picker
- Tag selection
- Article linking
- Status/scheduling

### ArticleModal

Create/edit article form.

```tsx
import ArticleModal from "@/components/admin/articles/ArticleModal";

<ArticleModal
  article={selectedArticle}
  onClose={() => setShowModal(false)}
  onSave={() => refetchArticles()}
/>
```

**Features:**
- Markdown editor
- Cover image upload
- Category/tag selection
- Read time calculation
- Status/scheduling

### AlbumModal

Create/edit album with photo selection.

```tsx
import AlbumModal from "@/components/admin/albums/AlbumModal";

<AlbumModal
  album={selectedAlbum}
  onClose={() => setShowModal(false)}
  onSave={() => refetchAlbums()}
/>
```

**Features:**
- Photo selection grid
- Drag-to-reorder photos
- Cover image selection
- Visibility toggle

### BatchUploadModal

Multiple file upload with progress.

```tsx
import BatchUploadModal from "@/components/admin/photos/BatchUploadModal";

<BatchUploadModal
  onClose={() => setShowUpload(false)}
  onUploadComplete={() => refetchPhotos()}
/>
```

**Features:**
- Drag & drop support
- Upload progress bars
- EXIF auto-extraction
- Batch metadata editing

### TaxonomyManager

Category and tag management.

```tsx
import TaxonomyManager from "@/components/admin/TaxonomyManager";

<TaxonomyManager type="photo" />  // or "article"
```

## Design Patterns

### Client vs Server Components

```tsx
// Server Component (default)
export default function PhotoList() {
  // No "use client" directive
  // Can use async/await
  // No hooks or event handlers
}

// Client Component
"use client";

export function LikeButton({ photoSlug }: { photoSlug: string }) {
  const [liked, setLiked] = useState(false);
  // Can use hooks and event handlers
}
```

### Modal Pattern

```tsx
const [isOpen, setIsOpen] = useState(false);
const [selected, setSelected] = useState<Item | null>(null);

// Open for edit
const handleEdit = (item: Item) => {
  setSelected(item);
  setIsOpen(true);
};

// Open for create
const handleCreate = () => {
  setSelected(null);
  setIsOpen(true);
};

// Close
const handleClose = () => {
  setSelected(null);
  setIsOpen(false);
};

{isOpen && (
  <Modal
    item={selected}
    onClose={handleClose}
    onSave={() => {
      handleClose();
      refetch();
    }}
  />
)}
```

### Form State Pattern

```tsx
const [formData, setFormData] = useState({
  title: item?.title || "",
  category: item?.category || "",
});

const handleChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};

const handleSubmit = async () => {
  setLoading(true);
  try {
    await fetch("/api/items", {
      method: item ? "PUT" : "POST",
      body: JSON.stringify(formData),
    });
    onSave();
  } catch (error) {
    setError("Failed to save");
  } finally {
    setLoading(false);
  }
};
```

## Styling Conventions

### Tailwind Classes

```tsx
// Button variants
const primaryBtn = "px-4 py-2 bg-[#6b9e9a] text-white rounded-full hover:bg-[#5a8a87] transition-colors";
const secondaryBtn = "px-4 py-2 border border-stone-300 text-stone-600 rounded-full hover:border-[#6b9e9a] hover:text-[#6b9e9a] transition-colors";

// Card hover effect
const cardHover = "group transition-all duration-500 hover:scale-[1.02]";

// Typography
const heading = "font-serif text-2xl md:text-3xl text-stone-700";
const body = "text-stone-600 leading-relaxed";
const meta = "text-xs tracking-[0.2em] uppercase text-stone-400";
```

### Color Palette

| Variable | Color | Usage |
|----------|-------|-------|
| Teal | `#6b9e9a` | Primary accent, links |
| Amber | `#c9a77c` | Secondary accent |
| Stone-700 | `#44403c` | Primary text |
| Stone-500 | `#78716c` | Secondary text |
| Stone-400 | `#a8a29e` | Muted text |

### Animation

```tsx
// Hover transitions
className="transition-all duration-500"

// Image zoom
className="transition-transform duration-700 group-hover:scale-[1.03]"

// Fade in
className="transition-opacity duration-300"
```

## Custom Hooks

### useUpload

File upload with progress tracking.

```tsx
import { useUpload } from "@/hooks/useUpload";

const { upload, progress, isUploading } = useUpload();

const handleUpload = async (file: File) => {
  const result = await upload(file);
  console.log("Uploaded:", result.url);
};
```

### useExifExtraction

Extract EXIF data from images.

```tsx
import { useExifExtraction } from "@/hooks/useExifExtraction";

const { extractExif } = useExifExtraction();

const handleFile = async (file: File) => {
  const exif = await extractExif(file);
  console.log("Camera:", exif.camera);
  console.log("Lens:", exif.lens);
  console.log("Date:", exif.date);
};
```

## Testing Components

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { LikeButton } from "@/components/photo";

describe("LikeButton", () => {
  it("toggles like state on click", async () => {
    render(<LikeButton photoSlug="test-photo" />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-stone-400");

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveClass("text-red-500");
    });
  });
});
```
