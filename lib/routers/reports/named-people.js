module.exports = () => (req, res, next) => {
  const { knex } = req.models;

  return Promise.resolve()
    .then(() => {
      return knex({ p: 'profiles' })
        .select('p.title', 'p.firstName', 'p.lastName', 'p.email', 'p.telephone')
        .select(knex.raw(`CASE WHEN permissions.role = 'admin' THEN 1 ELSE 0 END AS admin`))
        .select(knex.raw(`string_agg(DISTINCT roles.type, ', ') AS roles`))
        .select('establishments.name AS establishment')
        .select('establishments.status AS establishmentStatus')
        .join('permissions', 'permissions.profileId', '=', 'p.id')
        .join('establishments', 'permissions.establishmentId', '=', 'establishments.id')
        .leftJoin('roles', builder => {
          builder.on('roles.profileId', '=', 'p.id').andOn('roles.establishmentId', '=', 'establishments.id');
        })
        .where('permissions.role', 'admin')
        .orWhereNotNull('roles.id')
        .groupBy(['establishments.id', 'p.id', 'permissions.role'])
        .orderBy(['p.lastName', 'p.firstName', 'establishments.name']);
    })
    .then(namedPeopleAndAdmins => {
      res.response = namedPeopleAndAdmins;
    })
    .then(() => next())
    .catch(next);
};
