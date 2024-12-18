import { useState, useRef, useEffect, useCallback } from 'react';
import { useFormContext } from '../../../context/FormContext';

export const useSelect = ({
                              name,
                              options = [],
                              value,
                              onChange,
                              multiple = false,
                              searchable = false,
                              validation = {}
                          }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef(null);
    const listRef = useRef(null);
    const { registerField, unregisterField, setFieldValue, getFieldError } = useFormContext();

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedOption = multiple
        ? options.filter(option => value?.includes(option.value))
        : options.find(option => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const validateValue = useCallback((val) => {
        if (validation.required && !val) {
            return 'This field is required';
        }
        if (validation.custom) {
            return validation.custom(val);
        }
        return '';
    }, [validation]);

    const handleSelect = useCallback((option) => {
        let newValue;
        if (multiple) {
            newValue = value?.includes(option.value)
                ? value.filter(v => v !== option.value)
                : [...(value || []), option.value];
        } else {
            newValue = option.value;
            setIsOpen(false);
        }

        if (onChange) {
            onChange(newValue);
        }

        if (setFieldValue && name) {
            setFieldValue(name, newValue, validateValue(newValue));
        }

        if (searchable) {
            setSearchQuery('');
        }
    }, [multiple, onChange, searchable, setFieldValue, name, validateValue, value]);

    const handleKeyDown = useCallback((e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(i =>
                    i < filteredOptions.length - 1 ? i + 1 : i
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(i => i > 0 ? i - 1 : i);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex !== -1) {
                    handleSelect(filteredOptions[highlightedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            case 'Tab':
                setIsOpen(false);
                break;
            default:
                break;
        }
    }, [isOpen, filteredOptions, highlightedIndex, handleSelect]);

    return {
        isOpen,
        searchQuery,
        filteredOptions,
        selectedOption,
        highlightedIndex,
        error: getFieldError ? getFieldError(name) : undefined,
        containerRef,
        listRef,
        setIsOpen,
        setSearchQuery,
        setHighlightedIndex,
        handleSelect,
        handleKeyDown
    };
};