import { Route, Routes } from 'react-router'

import AppLayout from '../shared/components/AppLayout'
import HomePage from '../features/home/ui/pages/HomePage'
import ClosetPage from '../features/wardrobe/ui/pages/ClosetPage'
import AddGarmentPage from '../features/wardrobe/ui/pages/AddGarmentPage'
import EditGarmentPage from '../features/wardrobe/ui/pages/EditGarmentPage'
import OutfitBuilderPage from '../features/outfits/ui/pages/OutfitBuilderPage'
import SavedOutfitsPage from '../features/outfits/ui/pages/SavedOutfitsPage'
import EditOutfitPage from '../features/outfits/ui/pages/EditOutfitPage'
import SettingsPage from '../features/settings/ui/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="closet" element={<ClosetPage />} />
        <Route path="closet/new" element={<AddGarmentPage />} />
        <Route path="closet/:garmentId/edit" element={<EditGarmentPage />} />
        <Route path="outfit" element={<OutfitBuilderPage />} />
        <Route path="outfits" element={<SavedOutfitsPage />} />
        <Route path="outfits/:outfitId/edit" element={<EditOutfitPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
