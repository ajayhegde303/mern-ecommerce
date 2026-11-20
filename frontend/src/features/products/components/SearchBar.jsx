import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Paper, InputBase, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { setSearchTerm } from '../ProductSlice'; // We will add this action next

export const SearchBar = () => {
    const [query, setQuery] = useState('');
    const dispatch = useDispatch();

    const handleSearch = (e) => {
        e.preventDefault(); // Prevents page from reloading
        dispatch(setSearchTerm(query));
    };

    return (
        <Paper
            component="form"
            onSubmit={handleSearch}
            sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: { xs: 200, sm: 300, md: 400 } }}
        >
            <InputBase
                sx={{ ml: 1, flex: 1 }}
                placeholder="Search Products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
                <SearchIcon />
            </IconButton>
        </Paper>
    );
};