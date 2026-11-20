import { Stack, TextField, Typography, Button, Radio, Paper, IconButton, useMediaQuery } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import React, { useEffect, useState } from 'react';
import { Cart } from '../../cart/components/Cart';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// ✨ 1. IMPORT RAZORPAY HOOK AND OTHER UTILITIES
import useRazorpay from '../../../hooks/usePayment/useRazorpay';
import { SHIPPING, TAXES } from '../../../constants';
import { addAddressAsync, selectAddressStatus, selectAddresses } from '../../address/AddressSlice';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import { createOrderAsync, selectCurrentOrder, selectOrderStatus } from '../../order/OrderSlice';
import { resetCartByUserIdAsync, selectCartItems } from '../../cart/CartSlice';

export const Checkout = () => {
    // ✨ 2. USE THE RAZORPAY HOOK AND GET DATA
    const isRazorpayLoaded = useRazorpay();
    const addresses = useSelector(selectAddresses);
    const loggedInUser = useSelector(selectLoggedInUser);
    const cartItems = useSelector(selectCartItems);
    const currentOrder = useSelector(selectCurrentOrder);
    const orderStatus = useSelector(selectOrderStatus);
    const addressStatus = useSelector(selectAddressStatus);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [selectedAddress, setSelectedAddress] = useState(addresses[0] || null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('COD'); // Default to COD

    const orderTotal = cartItems.reduce((acc, item) => (item.product.price * item.quantity) + acc, 0);
    const is900 = useMediaQuery(theme => theme.breakpoints.down(900));
    const is480 = useMediaQuery(theme => theme.breakpoints.down(480));

    useEffect(() => {
        if (addressStatus === 'fulfilled') {
            reset();
        } else if (addressStatus === 'rejected') {
            alert('Error adding your address');
        }
    }, [addressStatus, reset]);

    useEffect(() => {
        if (currentOrder && currentOrder?._id) {
            dispatch(resetCartByUserIdAsync(loggedInUser?._id));
            navigate(`/order-success/${currentOrder?._id}`);
        }
    }, [currentOrder, dispatch, loggedInUser?._id, navigate]);

    const handleAddAddress = (data) => {
        const address = { ...data, user: loggedInUser._id };
        dispatch(addAddressAsync(address));
    };

    // ✨ 3. CREATE THE RAZORPAY PAYMENT HANDLER
    const handleRazorpayPayment = async () => {
        if (!isRazorpayLoaded) {
            alert('Razorpay SDK is not loaded yet.');
            return;
        }

        const orderResponse = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/payment/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: orderTotal + SHIPPING + TAXES,
                currency: 'INR',
                receipt: `receipt_order_${new Date().getTime()}`,
            }),
        });
        const orderData = await orderResponse.json();

        const options = {
            key: import.meta.env.REACT_APP_RAZORPAY_KEY_ID,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'MERN Shop',
            description: 'Order Payment',
            order_id: orderData.id,
            handler: function (response) {
                // On successful payment, create the order in your database
                const order = {
                    user: loggedInUser._id,
                    item: cartItems,
                    address: selectedAddress,
                    paymentMode: 'Razorpay',
                    total: orderTotal + SHIPPING + TAXES,
                    paymentDetails: {
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                    }
                };
                dispatch(createOrderAsync(order));
            },
            prefill: {
                name: loggedInUser.name,
                email: loggedInUser.email,
            },
            theme: {
                color: '#3399cc',
            },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    // ✨ 4. CREATE A MAIN ORDER HANDLER TO DECIDE WHICH PAYMENT METHOD TO USE
    const handleOrder = () => {
        if (!selectedAddress) {
            alert('Please select a shipping address.');
            return;
        }

        if (selectedPaymentMethod === 'COD') {
            const order = {
                user: loggedInUser._id,
                item: cartItems,
                address: selectedAddress,
                paymentMode: 'COD',
                total: orderTotal + SHIPPING + TAXES,
            };
            dispatch(createOrderAsync(order));
        } else if (selectedPaymentMethod === 'Razorpay') {
            handleRazorpayPayment();
        }
    };

    return (
        <Stack flexDirection={'row'} p={2} rowGap={10} justifyContent={'center'} flexWrap={'wrap'} mb={'5rem'} mt={2} columnGap={4} alignItems={'flex-start'}>
            {/* Left Box (Address and Payment) */}
            <Stack rowGap={4}>
                {/* ... your existing heading and address form JSX ... */}
                {/* existing address */}
                <Stack rowGap={3}>
                    {/* ... your existing address list JSX ... */}
                </Stack>
                {/* payment methods */}
                <Stack rowGap={3}>
                    <Stack>
                        <Typography variant='h6'>Payment Methods</Typography>
                        <Typography variant='body2' color={'text.secondary'}>Please select a payment method</Typography>
                    </Stack>
                    <Stack rowGap={2}>
                        <Stack flexDirection={'row'} justifyContent={'flex-start'} alignItems={'center'}>
                            <Radio value="COD" name='paymentMethod' checked={selectedPaymentMethod === 'COD'} onChange={(e) => setSelectedPaymentMethod(e.target.value)} />
                            <Typography>Cash on Delivery</Typography>
                        </Stack>
                        {/* ✨ 5. ADD RAZORPAY AS A PAYMENT OPTION */}
                        <Stack flexDirection={'row'} justifyContent={'flex-start'} alignItems={'center'}>
                            <Radio value="Razorpay" name='paymentMethod' checked={selectedPaymentMethod === 'Razorpay'} onChange={(e) => setSelectedPaymentMethod(e.target.value)} />
                            <Typography>Pay Online with Razorpay</Typography>
                        </Stack>
                    </Stack>
                </Stack>
            </Stack>

            {/* Right Box (Order Summary) */}
            <Stack width={is900 ? '100%' : 'auto'} alignItems={is900 ? 'flex-start' : ''}>
                <Typography variant='h4'>Order summary</Typography>
                <Cart checkout={true} />
                {/* ✨ 6. UPDATE THE FINAL BUTTON'S ONCLICK HANDLER */}
                <LoadingButton
                    fullWidth
                    loading={orderStatus === 'pending'}
                    variant='contained'
                    onClick={handleOrder}
                    size='large'
                    // Disable button if Razorpay is selected but not loaded
                    disabled={selectedPaymentMethod === 'Razorpay' && !isRazorpayLoaded}
                >
                    {selectedPaymentMethod === 'Razorpay' && !isRazorpayLoaded ? 'Loading Payment...' : 'Pay and order'}
                </LoadingButton>
            </Stack>
        </Stack>
    );
}