module.exports = () => (req, res, next) => {
  const { knex } = req.models;

  return Promise.resolve()
    .then(() => {
      return knex({ p: 'profiles' })
        .select('p.title', 'p.first_name', 'p.last_name', 'p.email', 'p.telephone')
        .select(knex.raw(`CASE WHEN permissions.role = 'admin' THEN 1 ELSE 0 END AS admin`))
        .select(knex.raw(`string_agg(DISTINCT roles.type, ', ') AS roles`))
        .select('establishments.name AS establishment')
        .join('permissions', 'permissions.profile_id', '=', 'p.id')
        .join('establishments', 'permissions.establishment_id', '=', 'establishments.id')
        .leftJoin('roles', builder => {
          builder.on('roles.profile_id', '=', 'p.id').andOn('roles.establishment_id', '=', 'establishments.id');
        })
        .where('permissions.role', 'admin')
        .orWhereNotNull('roles.id')
        .groupBy('establishments.id', 'p.id', 'permissions.role')
        .orderBy(['p.last_name', 'p.first_name', 'establishments.name']);
    })
    .then(namedPeopleAndAdmins => {
      res.response = namedPeopleAndAdmins;
    })
    .then(() => next())
    .catch(next);
};
