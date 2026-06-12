// @mui
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  IconButton,
  Box
} from '@mui/material';
// components
import Iconify from '@/components/Iconify';

// ----------------------------------------------------------------------

export interface Tenant {
  code: string;
  name: string;
}

const TENANTS: Tenant[] = [
  { code: 'STEM', name: 'Khoa học & Kỹ thuật' },
  { code: 'ENGLISH', name: 'Trung tâm Anh ngữ' },
  { code: 'KNS', name: 'Kỹ năng sống' },
  { code: 'MATH', name: 'Toán tư duy' },
  { code: 'ART', name: 'Năng khiếu Mỹ thuật' },
  { code: 'MUSIC', name: 'Học viện Âm nhạc' },
  { code: 'SPORT', name: 'Giáo dục Thể chất' },
  { code: 'CODE', name: 'Lập trình Trẻ em' },
];

export interface AdminDashboardTenantModalProps {
  open: boolean;
  onClose: () => void;
  tenants?: Tenant[];
}

export default function AdminDashboardTenantModal({ open, onClose, tenants }: AdminDashboardTenantModalProps) {
  const displayTenants = tenants && tenants.length > 0 ? tenants : TENANTS;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Danh sách Mảng giảng dạy</Typography>
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <List sx={{ pt: 0 }}>
          {displayTenants.map((tenant) => (
            <ListItem key={tenant.code} divider>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                      {tenant.code}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {tenant.name}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
