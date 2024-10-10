// src/components/Shuffle.js
import React, { useState, useRef, useEffect } from 'react';
import DraggableList from 'react-draggable-list';
import { ref, update } from 'firebase/database';
import { database, auth } from '../firebase';
import { useQueue } from '../QueueContext';
import './Shuffle.css'

const ConfirmationPopup = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '5px',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <p>{message}</p>
        <button onClick={onConfirm} style={{ marginRight: '10px' }}>Yes</button>
        <button onClick={onCancel}>No</button>
      </div>
    </div>
  );
};

const Shuffle = () => {
    const { data, loading, error } = useQueue();
    const [items, setItems] = useState([]);
    const containerRef = useRef(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const processPatientList = (patientList) => {
        const doctorPatients = new Map();
      
        return patientList.map((patient, index) => {
            const updatedPatient = { ...patient };
            updatedPatient.sno = (index + 1).toString();
      
            if (!doctorPatients.has(updatedPatient.docname)) {
                doctorPatients.set(updatedPatient.docname, []);
            }
            const patientsForDoctor = doctorPatients.get(updatedPatient.docname);
      
            if (patientsForDoctor.length === 0) {
                updatedPatient.waitno = 0;
            } else if (patientsForDoctor.length === 1) {
                updatedPatient.waitno = 1;
            } else {
                updatedPatient.waitno = patientsForDoctor.length;
            }
      
            patientsForDoctor.push(updatedPatient);
      
            return updatedPatient;
        });
    };

    useEffect(() => {
        if (data) {
            setItems(processPatientList(data));
        }
    }, [data]);

    function transformData(data) {
        return data.reduce((acc, item, index) => {
          const { sno, ...rest } = item;
          acc[index + 1] = {
            ...rest,
            sno: (index + 1).toString()
          };
          return acc;
        }, {});
    }

    const capitalize = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const updateArrayAfterDeletion = (arr, snoToDelete) => {
        snoToDelete = snoToDelete.toString();
        let doctorWaitMap = new Map();
        let updatedArr = arr.filter(item => item.sno !== snoToDelete)
                            .map((item, index) => {
          item.sno = (index + 1).toString();
          if (!doctorWaitMap.has(item.docname)) {
            doctorWaitMap.set(item.docname, 0);
          }
          item.waitno = doctorWaitMap.get(item.docname);
          doctorWaitMap.set(item.docname, item.waitno + 1);
          return item;
        });
        return updatedArr;
    };

    const TemplateItem = ({item, itemSelected, dragHandleProps}) => {
        const [isHovered, setIsHovered] = useState(false);
        const [isClicked, setIsClicked] = useState(false);
        const [isItemHovered, setIsItemHovered] = useState(false);
    
        const styles = {
            item: {
                userSelect: 'none',
                padding: '16px',
                margin: '0 0 8px 0',
                minHeight: '50px',
                width: '400px',
                marginLeft: '-100px',
                backgroundColor: itemSelected ? '#3A5A72' : '#3865ad',
                color: 'white',
                cursor: 'move',
                transition: 'all 0.3s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '25px',
                transform: isItemHovered ? 'scale(1.10)' : 'scale(1)',
                boxShadow: isItemHovered ? '0 5px 15px rgba(0,0,0,0.3)' : 'none',
                zIndex: isItemHovered ? 1 : 'auto',
            },
            leftSection: {
                flex: '1',
            },
            rightSection: {
                marginLeft: '20px',
                fontSize: '1.2em',
                fontWeight: 'bold',
            },
            name: {
                fontSize: '1.1em',
                fontWeight: 'bold',
                marginBottom: '5px',
            },
            details: {
                fontSize: '0.9em',
                opacity: '0.8',
            },
            deleteSection: {
                marginLeft: '20px',
            },
            deleteButton: {
                width: '50px',
                height: '50px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                outline: 'none',
            },
            deleteImage: {
                width: '100%',
                height: '100%',
                transition: 'all 0.1s ease',
                transform: isClicked ? 'scale(1.25)' : 'scale(1)',
            }
        };
    
        const getWaitStatus = (waitno) => {
            if (waitno === 0) return 'In Consultation';
            if (waitno === 1) return 'Next';
            return waitno.toString();
        };
    
        const handleDeleteClick = () => {
            setIsClicked(true);
            setTimeout(() => setIsClicked(false), 100);
            setItemToDelete(item);
            setIsConfirmationOpen(true);
        };
    
        return (
            <div 
                style={styles.item} 
                {...dragHandleProps}
                onMouseEnter={() => setIsItemHovered(true)}
                onMouseLeave={() => setIsItemHovered(false)}
            >
                <div style={styles.leftSection}>
                    <div style={styles.name}>{capitalize(item.name)}</div>
                    <div style={styles.details}>{capitalize(item.docname)} | {capitalize(item.docdept)}</div>
                </div>
                <div style={styles.rightSection}>
                    {getWaitStatus(item.waitno)}
                </div>
                <div style={styles.deleteSection}>
                    <button 
                        style={styles.deleteButton}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onClick={handleDeleteClick}
                    >
                        <img src="/delete.png" alt="Delete" style={styles.deleteImage} />
                    </button>
                </div>
            </div>
        );
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        const deletedList = updateArrayAfterDeletion(items, itemToDelete.sno);
        setItems(deletedList);

        try {
            console.log("I am trying to update database and the uid is : ", auth.currentUser.uid);
            await update(ref(database, 'users/' + auth.currentUser.uid), { 
                realtime: JSON.stringify(transformData(deletedList))
            });
        } catch (error) {
            console.log('Error found while updating to firebase database', error);
        }

        setIsConfirmationOpen(false);
        setItemToDelete(null);
    };

    const handleCancelDelete = () => {
        setIsConfirmationOpen(false);
        setItemToDelete(null);
    };

    const _onListChange = async(newList) => {
        const finalList = (processPatientList(newList));
        setItems(finalList)
        try {
            console.log("I am trying to update database and the uid is : ", auth.currentUser.uid)
            await update(ref(database, 'users/' + auth.currentUser.uid), { realtime: JSON.stringify(transformData(finalList))})
        } catch(error) {
            console.log('error found while updating to firebase database', error)
        }
    };

    const styles = {
        container: {
            maxWidth: '300px',
            margin: '0 auto',
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
        },
        list: {
            listStyleType: 'none',
            padding: 0,
        },
        emptyMessage: {
            textAlign: 'center',
            fontSize: '1.2em',
            color: '#666',
            marginTop: '20px',
        },
    };

    if (loading) {
        return <div style={styles.emptyMessage}>Loading...</div>;
    }

    if (error) {
        return <div style={styles.emptyMessage}>Error: {error}</div>;
    }

    if (!items || items.length === 0) {
        return <div style={styles.emptyMessage}>Patient List Empty</div>;
    }

    return (
        <div style={styles.container}>
            <div ref={containerRef} style={styles.list}>
                <DraggableList
                    itemKey="sno"
                    template={TemplateItem}
                    list={items}
                    onMoveEnd={(newList) => _onListChange(newList)}
                    container={() => containerRef.current}
                />
            </div>
            <ConfirmationPopup
                isOpen={isConfirmationOpen}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                message="Are you sure you want to delete this patient?"
            />
        </div>
    );
};

export default Shuffle;