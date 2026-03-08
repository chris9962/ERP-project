create policy "Authenticated users can delete salary_periods"
  on salary_periods for delete to authenticated using (true);

create policy "Authenticated users can delete salary_records"
  on salary_records for delete to authenticated using (true);
