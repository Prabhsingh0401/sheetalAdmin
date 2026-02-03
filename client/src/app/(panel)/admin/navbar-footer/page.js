// sheetalAdmin/client/src/app/(panel)/admin/navbar-footer/page.js
import React from 'react';
import NavbarLayoutEditor from '../../../../components/admin/navbar-footer/NavbarLayoutEditor';

const NavbarFooterPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Navbar and Footer Management</h1>
      <NavbarLayoutEditor />
    </div>
  );
};

export default NavbarFooterPage;
