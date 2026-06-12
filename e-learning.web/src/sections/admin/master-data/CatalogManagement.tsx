import { useState, useEffect } from 'react';
// @mui
import {
  Card,
  Table,
  Button,
  TableRow,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  Tabs,
  Tab,
  Box,
  IconButton,
  Tooltip,
  Stack,
  Typography,
} from '@mui/material';
// hooks
import useTabs from '@/hooks/useTabs';
import useTable, { getComparator, emptyRows } from '@/hooks/useTable';
import useRequest from '@/hooks/useRequest';
import useToggle from '@/hooks/useToggle';
// components
import Iconify from '@/components/Iconify';
import Scrollbar from '@/components/Scrollbar';
import Label from '@/components/Label';
import { TableHeadCustom, TableNoData, TableEmptyRows } from '@/components/table';
// requests
import AdminRequest from '@/requests/factory/AdminRequest';
import { CatalogItem } from '@/types/admin';
//
import CatalogNewEditForm from './CatalogNewEditForm';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Tên danh mục', align: 'left' },
  { id: 'code', label: 'Mã (Code)', align: 'left' },
  { id: 'description', label: 'Mô tả', align: 'left' },
  { id: 'isActive', label: 'Trạng thái', align: 'center' },
  { id: '' },
];

const CATALOG_TYPES = [
  { value: 'document-type', label: 'Loại tài liệu' },
  { value: 'content-status', label: 'Trạng thái nội dung' },
  { value: 'account-type', label: 'Loại tài khoản' },
  { value: 'display-label', label: 'Nhãn hiển thị' },
];

// ----------------------------------------------------------------------

export default function CatalogManagement() {
  const {
    dense,
    page,
    order,
    orderBy,
    rowsPerPage,
    setPage,
    //
    onSort,
    onChangePage,
    onChangeRowsPerPage,
  } = useTable();

  const { currentTab: filterType, onChangeTab: onFilterType } = useTabs('document-type');

  const [tableData, setTableData] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogItem | undefined>(undefined);

  const { toggle: openForm, onOpen: onOpenForm, onClose: onCloseForm } = useToggle();

  const adminReq = useRequest(AdminRequest);

  const fetchCatalogs = async () => {
    setLoading(true);
    try {
      const response = await adminReq.getCatalog(filterType);
      const data = response?.data?.items || response?.data || response?.payload || [];
      setTableData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const handleEditRow = (row: CatalogItem) => {
    setSelectedCatalog(row);
    onOpenForm();
  };

  const handleDeleteRow = async (id: string) => {
    try {
      await adminReq.deleteCatalog(filterType, id);
      fetchCatalogs();
    } catch (error) {
      console.error(error);
    }
  };

  const dataFiltered = applySortFilter({
    tableData,
    comparator: getComparator(order, orderBy),
  });

  const isNotFound = !dataFiltered.length && !!filterType;

  return (
    <>
      <Card>
        <Stack spacing={2} sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ md: 'center' }}
            justifyContent="space-between"
          >
            <Typography variant="h6">Danh mục dùng chung</Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon={'eva:plus-fill'} />}
              onClick={() => {
                setSelectedCatalog(undefined);
                onOpenForm();
              }}
            >
              Thêm mới
            </Button>
          </Stack>

          <Tabs
            value={filterType}
            onChange={onFilterType}
            sx={{ px: 2, bgcolor: 'background.neutral' }}
          >
            {CATALOG_TYPES.map((tab) => (
              <Tab disableRipple key={tab.value} label={tab.label} value={tab.value} />
            ))}
          </Tabs>
        </Stack>

        <Scrollbar>
          <TableContainer sx={{ minWidth: 800, position: 'relative' }}>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHeadCustom order={order} orderBy={orderBy} headLabel={TABLE_HEAD} onSort={onSort} />

              <TableBody>
                {dataFiltered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                  <TableRow hover key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.code}</TableCell>
                    <TableCell>{row.description || '-'}</TableCell>
                    <TableCell align="center">
                      <Label color={row.isActive ? 'success' : 'error'}>
                        {row.isActive ? 'Hoạt động' : 'Tắt'}
                      </Label>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Chỉnh sửa">
                        <IconButton onClick={() => handleEditRow(row)}>
                          <Iconify icon={'eva:edit-fill'} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton color="error" onClick={() => handleDeleteRow(row.id)}>
                          <Iconify icon={'eva:trash-2-outline'} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}

                <TableEmptyRows height={dense ? 52 : 72} emptyRows={emptyRows(page, rowsPerPage, tableData.length)} />

                <TableNoData isNotFound={isNotFound} />
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <Box sx={{ position: 'relative' }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={tableData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={onChangePage}
            onRowsPerPageChange={onChangeRowsPerPage}
          />
        </Box>
      </Card>

      <CatalogNewEditForm
        open={openForm}
        onClose={onCloseForm}
        onSuccess={fetchCatalogs}
        isEdit={!!selectedCatalog}
        currentCatalog={selectedCatalog}
        type={filterType}
        adminReq={adminReq}
      />
    </>
  );
}

// ----------------------------------------------------------------------

function applySortFilter({
  tableData,
  comparator,
}: {
  tableData: CatalogItem[];
  comparator: (a: any, b: any) => number;
}) {
  if (!tableData) return [];

  const stabilizedThis = tableData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  return stabilizedThis.map((el) => el[0]);
}
