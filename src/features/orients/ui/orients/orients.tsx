import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'

import { Paper, SelectChangeEvent } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { OrientsFilter } from '../orients-filter/orients-filter'
import { EditOrient } from '../edit-orient/edit-orient'
import { OrientsService } from '../../service/orients-service'
import { Orient } from '../../types/orient'

import { useModal } from '@/shared/ui/modal/context/modal-context'
import { useConfirmDialog } from '@/shared/ui/confirm-dialog/context/confirm-dialog-context'

import { Column, Sort, Table } from '@/shared/ui/table'
import { Actions } from '@/shared/ui/actions/actions'

import {
  Error,
  ResponseWithMessage,
  ResponseWithPagination,
} from '@/shared/http'
import debounce from 'lodash.debounce'

export const Orients = () => {
  const { push } = useRouter()
  const queryClient = useQueryClient()
  const { openConfirm, closeConfirm } = useConfirmDialog()
  const { openModal } = useModal()

  const [sort, setSort] = useState<Sort>({
    orderby: 'asc',
    sort: 'id',
  })

  const [page, setPage] = useState<number>(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [search, setSearch] = useState('')
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('')
  const [branch, setBranch] = useState<number | null>(null)

  const {
    data: orients,
    isError,
    isFetching,
  } = useQuery<ResponseWithPagination<Orient[]>, Error>({
    queryKey: [
      'orients',
      sort,
      page,
      rowsPerPage,
      debouncedSearchValue,
      branch,
    ],
    queryFn: () =>
      OrientsService.getOrients({
        branch_id: branch,
        orderby: sort.orderby,
        sort: sort.sort,
        page: page,
        perpage: rowsPerPage,
        search: debouncedSearchValue,
      }),
    onError: (error) => {
      enqueueSnackbar({
        message: error.message,
        variant: 'error',
      })
    },
    retry: 0,
    keepPreviousData: true,
  })

  const deleteMutation = useMutation<ResponseWithMessage, Error, number>({
    mutationFn: OrientsService.deleteOrient,
    onSuccess: (data) => {
      if (orients?.data.length === 1 && page !== 1) {
        setPage((prevState) => prevState - 1)
      } else {
        queryClient.invalidateQueries([
          'orients',
          sort,
          page,
          rowsPerPage,
          debouncedSearchValue,
          branch,
        ])
      }
      closeConfirm()
      enqueueSnackbar(data.message, {
        variant: 'success',
      })
    },
    onError: (error) => {
      if (error?.status === 401) {
        push('/login')
      } else {
        enqueueSnackbar(error?.message, {
          variant: 'error',
        })
        closeConfirm()
      }
    },
  })

  const handleSort = (sort: Sort) => {
    setSort(sort)
  }

  const handleChangePage = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value)
  }

  const handleChangeRowsPerPage = (event: SelectChangeEvent<string>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(1)
  }

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearchValue(value)
      setPage(1)
    }, 500),
    [],
  )

  const handleUpdate = (id: number) => {
    openModal({
      title: 'Редактирование ориентира',
      modal: <EditOrient id={id} />,
    })
  }

  const handleDelete = (id: number) => {
    openConfirm({
      text: 'Вы действительно хотите удалить этот ориентир?',
      onConfirm: async () => {
        await deleteMutation.mutateAsync(id)
      },
    })
  }

  const columns: Column[] = [
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      width: 80,
    },
    {
      key: 'name',
      title: 'Название',
      sortable: true,
    },
    {
      key: 'branch_id',
      title: 'Регион',
      sortable: true,
    },
    {
      key: 'action',
      title: 'Действия',
      align: 'right',
      component: (item: any) => {
        return (
          <Actions
            onDelete={() => handleDelete(item.id)}
            onUpdate={() => handleUpdate(item.id)}
          />
        )
      },
      width: 100,
    },
  ]

  return (
    <Paper elevation={4}>
      <OrientsFilter
        search={search}
        onChangeSearch={(value) => {
          debouncedSearch(value)
          setSearch(value)
        }}
        onChangeBranch={(value) => {
          setBranch(value)
          setPage(1)
        }}
      />
      <Table
        columns={columns}
        data={orients?.data}
        onSort={handleSort}
        sort={sort}
        count={orients?.pagination.last_page || 1}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        isLoading={isFetching}
        isError={isError}
      />
    </Paper>
  )
}
