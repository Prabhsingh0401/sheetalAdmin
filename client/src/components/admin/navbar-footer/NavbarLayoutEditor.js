'use client';
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Home, ShoppingBag } from 'lucide-react';

const NavItemRenderer = ({ label, icon: Icon, children, href, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = children && children.length > 0;

  const toggleOpen = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  const getBackgroundColor = (level) => {
    switch (level) {
      case 0: return "bg-white";
      case 1: return "bg-gray-50";
      case 2: return "bg-gray-100";
      case 3: return "bg-gray-200";
      default: return "bg-white";
    }
  };

  const currentLevelPadding = (level * 20) + (level > 0 ? 16 : 0); // Indent + space for border

  return (
    <div className={`${level === 0 ? "min-w-[200px]" : "w-full"} group`}>
      <div
        className={`flex items-center space-x-2 cursor-pointer rounded-lg transition-all
          ${getBackgroundColor(level)}
          ${level === 0
            ? "p-4 border border-gray-200 shadow-sm hover:shadow-md"
            : `p-2 border-l-4 border-gray-300 hover:bg-gray-200`}
          `}
        style={{ paddingLeft: level === 0 ? 'auto' : `${currentLevelPadding}px` }}
        onClick={toggleOpen}
      >
        {hasChildren && (
          isOpen ? <ChevronDown size={16} className="text-gray-600" /> : <ChevronRight size={16} className="text-gray-600" />
        )}
        {Icon && <Icon size={16} className="text-gray-600" />}
        <span className={`text-sm ${level === 0 ? "text-gray-900 font-semibold" : "text-gray-800"}`}>
          {label}
        </span>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-600 hover:text-gray-800 hover:underline ml-auto"
          >
            ({href})
          </a>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className={`${level === 0 ? "ml-4 mt-2 flex flex-wrap gap-2" : "ml-0"}`}>
          {level === 0 ? (
            <ul className="flex flex-wrap gap-2">
              {children.map((child, index) => (
                <li key={index}>
                  <NavItemRenderer {...child} level={level + 1} />
                </li>
              ))}
            </ul>
          ) : (
            // Nested children in dropdown style
            <div className={`mt-1 rounded-md overflow-hidden ${level === 2 ? "ml-8" : ""}`}>
              <ul className="py-1">
                {children.map((child, index) => (
                  <li key={index}>
                    <NavItemRenderer {...child} level={level + 1} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const NavbarLayoutEditor = () => {
  const navbarStructure = [
    { label: "Home", icon: Home, href: "/" },
    {
      label: "Shop", icon: ShoppingBag, href: "#",
      children: [
        { label: "Sarees", href: "/category/sarees" },
        { label: "Salwar Suits", href: "/category/salwar-suits" },
        {
          label: "Lehengas", href: "/category/lehengas",
          children: [
            {
              label: "Bridal Lehengas", href: "/category/bridal-lehengas",
              children: [
                { label: "Heavy Bridal", href: "/category/heavy-bridal" },
                { label: "Light Bridal", href: "/category/light-bridal" },
                { label: "Designer Bridal", href: "/category/designer-bridal" },
              ]
            },
            { label: "Party Wear", href: "/category/party-wear-lehengas" },
          ]
        },
        { label: "Suits", href: "/category/suits" },
      ]
    },
    { label: "Our Story", href: "/about-us" },
    { label: "Add New Item" }
  ];

  return (
    <div className="p-4">
      <div className="p-4">
        <ul className="flex flex-wrap gap-4">
          {navbarStructure.map((item, index) => (
            <li key={index}> {/* Explicitly wrap in li */}
              <NavItemRenderer {...item} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NavbarLayoutEditor;