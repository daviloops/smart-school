'use client';

import { useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { enqueueSnackbar } from 'notistack';
import useSWR from 'swr';

import Stack from "@mui/joy/Stack";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from '@mui/joy/Button';

import ControlledInput from '@/components/ControlledInput';
import ControlledAutocomplete from '@/components/ControlledAutocomplete';
import { get } from '@/utils/fetcher';

import type { Student } from '@/types';

interface ICreateCourseFormData {
  course: string
  classroom: string
  capacity: number
  teacher: string
  students: Array<Student>
}

const validationSchema = yup.object().shape({
  course: yup.string()
  .required('Course name is required'),
  classroom: yup.string()
  .required('Classroom name is required'),
  capacity: yup.number()
  .required('Capacity is required')
  .integer('Needs to be integer')
  .test(
    'Is positive?', 
    'Needs to be positive', 
    (value) => value > 0
  ),
  teacher: yup.string()
  .required('Teacher is required'),
  students: yup.array<Student>()
  .required('Students is required'),
});

const CreateCourseForm = ({ onSuccess }: { onSuccess: Function }) => {
  const {
    data: dataStudents,
    error: errorStudents,
    isLoading: isLoadingStudents
  } = useSWR('/api/student', get);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ICreateCourseFormData>({
    mode: 'onBlur',
    resolver: yupResolver(validationSchema),
    defaultValues: {
      course: '',
      classroom: '',
      capacity: 0,
      teacher: '',
      students: [],
    },
  });
  const { course, classroom, capacity, teacher, students } = watch();

  const onSubmit = handleSubmit(async (e) => {
    console.log({e})
    const studentsIds = students.map(item => ({ id: item.id }));

    const payload = {
      name: course,
      classroom,
      capacity: Number(capacity),
      teacher,
      students: studentsIds,
    };

    setIsLoading(true);
    await fetch(
      '/api/course',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )
    .then((res) => res.json())
    .then((data) => {
      onSuccess({ data });
      enqueueSnackbar('Course created successfully', { variant: "success" });
    })
    .catch((e) => {
      enqueueSnackbar('Could not create course', { variant: "error" });
      console.error(e);
    })
    .finally(() => setIsLoading(false));
    
    // Todo: mutate courses
    // mutate(['/api/course', { payload: studentsIds }]);
  });

  useEffect(() => {
    if (errorStudents) {
      enqueueSnackbar('Could not get students data', { variant: "error" });
    }
  }, [errorStudents]);

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack spacing={2} maxWidth="22.5rem" sx={{ margin: 'auto' }}>
        <Typography component="h3" fontSize="1.25rem" textAlign="center">
          New course
        </Typography>
        
        <Stack spacing={3}>
          <Stack spacing={1}>
            <ControlledInput
              label="Course"
              name="course"
              placeholder="Biology II"
              control={control}
              errors={errors}
              required
            />
            <Stack spacing={3} direction="row">
              <Box width="100%">
                <ControlledInput
                  label="Classroom"
                  name="classroom"
                  placeholder="101"
                  control={control}
                  errors={errors}
                  required
                />
              </Box>
              <Box maxWidth="5rem">
                <ControlledInput
                  label="Capacity"
                  name="capacity"
                  placeholder="33"
                  type="number"
                  control={control}
                  errors={errors}
                  required
                />
              </Box>
            </Stack>
            <ControlledInput
              label="Teacher"
              name="teacher"
              placeholder="Socrates"
              control={control}
              errors={errors}
              required
            />
            <ControlledAutocomplete
              label="Students"
              name="students"
              disableCloseOnSelect
              control={control}
              errors={errors}
              loading={isLoadingStudents}
              multiple
              options={dataStudents || []}
              placeholder="Enter the students names..."
              limitTags={2}
              getOptionLabel={(option: any) => option.name || ''}
              isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
            />
          </Stack>
          <Box textAlign="center">
            <Button loading={isLoading} type="submit">
              Create
            </Button>
          </Box>
        </Stack>
      </Stack>
    </form>
  );
};

export default CreateCourseForm;
